import { Helmet } from "react-helmet-async";

export default function Admin() {
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/admin';
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
