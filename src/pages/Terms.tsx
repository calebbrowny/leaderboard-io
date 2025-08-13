import { Helmet } from "react-helmet-async";

export default function Terms() {
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/terms';
  return (
    <main className="container py-10">
      <Helmet>
        <title>Terms & Conditions — The Cave Gym Challenge</title>
        <meta name="description" content="Full terms and conditions for The Cave Gym Monthly Challenge." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-4xl font-extrabold tracking-tight mb-6">Terms & Conditions</h1>
      <div className="max-w-3xl space-y-4">
        <p>These terms are placeholders. Once Supabase is connected, admins can edit and publish markdown terms stored in the database.</p>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>Be honest and respectful.</li>
          <li>Submissions may be audited; provide proof where possible.</li>
          <li>By submitting you consent to leaderboard display of your name and result.</li>
        </ul>
      </div>
    </main>
  );
}
