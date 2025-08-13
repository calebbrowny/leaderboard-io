import { Helmet } from "react-helmet-async";

export default function Privacy() {
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/privacy';
  return (
    <main className="container py-10">
      <Helmet>
        <title>Privacy — The Cave Gym Challenge</title>
        <meta name="description" content="Privacy policy for The Cave Gym Monthly Challenge." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-4xl font-extrabold tracking-tight mb-6">Privacy</h1>
      <div className="max-w-3xl space-y-4">
        <p>We only display your name and result publicly. Email addresses are used for duplicate detection and communication about your submission.</p>
      </div>
    </main>
  );
}
