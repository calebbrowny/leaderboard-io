import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/admin';
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!mounted) return;
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) navigate("/", { replace: true });
    })();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <main className="container py-10">
      <Helmet>
        <title>Admin Console — The Cave Gym Challenge</title>
        <meta name="description" content="Admin console to manage monthly challenges and submissions." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Admin Console</h1>
      <p className="text-muted-foreground max-w-2xl">
        To enable authentication, moderation, and data management, please connect Supabase using Lovable's native integration (green button in the top right). Once connected, we'll add secure admin routes with role-based access, database tables, and realtime leaderboards.
      </p>
    </main>
  );
}
