import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/auth';

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const pageTitle = useMemo(() => (mode === "login" ? "Login" : "Sign Up") + " — The Cave Gym", [mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You are now signed in." });
        navigate("/", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirm your email to finish signing up." });
      }
    } catch (err: any) {
      toast({ title: "Auth error", description: err?.message ?? "Please try again" });
    }
  };

  const oauth = async (provider: "google" | "github" | "twitter") => {
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "OAuth error", description: err?.message ?? "Please try again" });
    }
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Login or sign up to create leaderboards and manage submissions." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-4xl font-extrabold tracking-tight mb-6">{mode === "login" ? "Login" : "Create your account"}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <form onSubmit={handleEmailAuth} className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit">{mode === "login" ? "Login" : "Sign Up"}</Button>
            <button type="button" className="text-sm text-muted-foreground text-left" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "No account? Sign up" : "Already have an account? Login"}
            </button>
          </form>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium mb-3">Or continue with</p>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => oauth("google")}>Continue with Google</Button>
            <Button variant="outline" onClick={() => oauth("github")}>Continue with GitHub</Button>
            <Button variant="outline" onClick={() => oauth("twitter")}>Continue with Twitter</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Note: Make sure the providers are configured in Supabase.</p>
        </Card>
      </div>
    </main>
  );
}
