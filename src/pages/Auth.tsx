
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/auth';
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signInWithEmail = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Success - redirect will happen via onAuthStateChange
      console.log('Sign in successful:', data);
    } catch (err: any) {
      console.error('Sign in error:', err);
      // If user doesn't exist, suggest signing up
      if (err?.message?.includes("Invalid login credentials") || err?.message?.includes("Email not confirmed")) {
        toast({ 
          title: "Account not found", 
          description: "No account found with these credentials. Would you like to sign up instead?" 
        });
        setActiveTab("signup");
        return;
      }
      toast({ title: "Sign in error", description: err?.message ?? "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword || !name) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters" });
      return;
    }

    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      
      // Create profile for the user
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            display_name: name,
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }
      
      toast({ title: "Success", description: "Account created successfully! You can now sign in." });
      setActiveTab("signin");
    } catch (err: any) {
      console.error('Sign up error:', err);
      // If user already exists, redirect to sign in
      if (err?.message?.includes("User already registered")) {
        toast({ 
          title: "Account exists", 
          description: "An account with this email already exists. Please sign in instead." 
        });
        setActiveTab("signin");
        return;
      }
      toast({ title: "Sign up error", description: err?.message ?? "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!resetEmail) {
      toast({ title: "Error", description: "Please enter your email address" });
      return;
    }

    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });
      
      if (error) throw error;
      toast({ 
        title: "Reset email sent", 
        description: "Check your email for password reset instructions" 
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err: any) {
      toast({ title: "Reset error", description: err?.message ?? "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>Sign In — The Cave Gym</title>
        <meta name="description" content="Sign in with email to create leaderboards and manage submissions." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center">Welcome</h1>
        <p className="text-muted-foreground text-center mb-8">Sign in to create and manage challenges</p>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Enter your details to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your email to receive reset instructions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={resetPassword} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Email"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForgotPassword(false)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                clearForm();
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                      className="px-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button 
                    onClick={signInWithEmail} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    onClick={signUpWithEmail} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
