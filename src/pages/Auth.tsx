import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/auth';

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: "google", 
        options: { redirectTo } 
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Authentication error", description: err?.message ?? "Please try again" });
    }
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>Sign In — The Cave Gym</title>
        <meta name="description" content="Sign in with Google to create leaderboards and manage submissions." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center">Welcome</h1>
        <p className="text-muted-foreground text-center mb-8">Sign in to create and manage challenges</p>
        
        <Card className="p-6">
          <Button 
            variant="outline" 
            onClick={signInWithGoogle}
            className="w-full"
            size="lg"
          >
            Continue with Google
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Note: Make sure Google OAuth is configured in Supabase.
          </p>
        </Card>
      </div>
    </main>
  );
}
