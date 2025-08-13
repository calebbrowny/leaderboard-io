import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardTable, LeaderboardSubmission, SortDirection } from "@/components/LeaderboardTable";
import { SubmissionForm, ChallengeMeta } from "@/components/SubmissionForm";
import { StatsBar, Stats } from "@/components/StatsBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

// Sample seed-like data – replace with Supabase once connected
const activeChallenge: ChallengeMeta & { title: string; month: number; year: number; description: string; prizes: string; rulesSummary: string; unit: string; sortDirection: SortDirection } = {
  id: "challenge-aug-2025",
  title: "Assault Bike 10 Cal Sprint (lowest time wins)",
  month: 8,
  year: 2025,
  description: "Sprint to 10 calories on the Assault Bike as fast as possible. Start from a dead stop.",
  prizes: "Top 3 win Cave Gym merch packs. One random spot prize for all approved entries.",
  rulesSummary: "Start at 0 RPM. No standing starts. Video proof recommended.",
  metricType: "time",
  unit: "mm:ss",
  sortDirection: "asc",
};

function ms(v: number) { return v; }
function time(msVal: number) {
  const totalSec = Math.floor(msVal / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

const seedApproved: LeaderboardSubmission[] = [
  { id: "1", fullName: "Alice Johnson", valueRaw: ms(62_000), valueDisplay: time(62_000), submittedAt: new Date().toISOString(), approvedAt: new Date().toISOString(), proofUrl: "https://example.com" },
  { id: "2", fullName: "Bob Smith", valueRaw: ms(59_500), valueDisplay: time(59_500), submittedAt: new Date().toISOString(), approvedAt: new Date(Date.now() - 3600e3).toISOString() },
  { id: "3", fullName: "Charlie Lee", valueRaw: ms(62_000), valueDisplay: time(62_000), submittedAt: new Date(Date.now() - 7200e3).toISOString(), approvedAt: new Date(Date.now() - 3500e3).toISOString() },
  { id: "4", fullName: "Diana Prince", valueRaw: ms(57_200), valueDisplay: time(57_200), submittedAt: new Date(Date.now() - 86400e3).toISOString(), approvedAt: new Date(Date.now() - 86000e3).toISOString(), proofUrl: "https://example.com" },
  { id: "5", fullName: "Ethan Hunt", valueRaw: ms(61_300), valueDisplay: time(61_300), submittedAt: new Date(Date.now() - 9600e3).toISOString(), approvedAt: new Date(Date.now() - 9500e3).toISOString() },
];

const maleIds = new Set(["2", "5"]);
const femaleIds = new Set(["1", "4"]);

function computeStats(subs: LeaderboardSubmission[], sortDirection: SortDirection): Stats {
  const total = subs.length;
  const approved = subs.length; // since we seed only approved
  if (total === 0) return { total, approved, bestDisplay: null, avgDisplay: null, lastUpdated: null };
  const sorted = [...subs].sort((a, b) => (sortDirection === "asc" ? a.valueRaw - b.valueRaw : b.valueRaw - a.valueRaw));
  const best = sorted[0];
  const avgRaw = Math.round(subs.reduce((acc, s) => acc + s.valueRaw, 0) / subs.length);
  const bestDisplay = best.valueDisplay;
  const avgDisplay = time(avgRaw);
  const latest = [...subs].sort((a, b) => new Date(b.approvedAt ?? b.submittedAt).getTime() - new Date(a.approvedAt ?? a.submittedAt).getTime())[0];
  const lastUpdated = new Date(latest.approvedAt ?? latest.submittedAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
  return { total, approved, bestDisplay, avgDisplay, lastUpdated };
}

export default function Index() {
  const [archive, setArchive] = useState("current");
  const challenge = activeChallenge;

  const approvedSubs = seedApproved;
  const male = approvedSubs.filter((s) => maleIds.has(s.id));
  const female = approvedSubs.filter((s) => femaleIds.has(s.id));

  const stats = useMemo(() => computeStats(approvedSubs, challenge.sortDirection), [approvedSubs, challenge.sortDirection]);

  const monthName = new Date(challenge.year, challenge.month - 1).toLocaleString("en-AU", { month: "long" });
  const pageTitle = `${monthName} ${challenge.year} — The Cave Gym Monthly Challenge`;
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com';

  return (
    <>
      <Helmet>
        <title>{pageTitle.slice(0, 58)}</title>
        <meta name="description" content={`Live leaderboards and submissions for ${challenge.title}`.slice(0, 158)} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="py-10">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-4 flex-wrap">
            {challenge.title}
            <a href="/admin" className="story-link">Admin</a>
            <a href="/auth" className="story-link">Login / Sign Up</a>
          </p>
        </div>
      </header>

      <main className="container pb-16">
        {/* Top tiles */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 hover-scale">
            <h2 className="text-2xl font-bold mb-2">What’s the challenge</h2>
            <p className="text-muted-foreground">{challenge.description}</p>
            <ul className="mt-3 list-disc pl-5 text-muted-foreground">
              <li>Start from a dead stop</li>
              <li>Record your best attempt</li>
              <li>Submit once per day (admin can change)</li>
            </ul>
          </Card>
          <Card className="p-6 hover-scale">
            <h2 className="text-2xl font-bold mb-2">Prizes</h2>
            <p className="text-muted-foreground">{challenge.prizes}</p>
          </Card>
          <Card className="p-6 hover-scale">
            <h2 className="text-2xl font-bold mb-2">Rules & Terms</h2>
            <p className="text-muted-foreground">{challenge.rulesSummary}</p>
            <a className="story-link mt-3 inline-block" href="/terms">Read full T&Cs</a>
          </Card>
          <div>
            <SubmissionForm challenge={challenge} />
          </div>
        </div>

        <div className="mt-10">
          <StatsBar stats={stats} />
        </div>

        {/* Archive selector */}
        <div className="mt-10 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">View:</span>
          <Select value={archive} onValueChange={setArchive}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current challenge</SelectItem>
              <SelectItem value="july-2025">July 2025 (archived)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboards */}
        <section className="mt-8" aria-label="Leaderboards">
          <Tabs defaultValue="female">
            <TabsList>
              <TabsTrigger value="female">Female</TabsTrigger>
              <TabsTrigger value="male">Male</TabsTrigger>
            </TabsList>
            <TabsContent value="female" className="mt-4">
              <LeaderboardTable title="Female" unit={challenge.unit} submissions={female} sortDirection={challenge.sortDirection} />
            </TabsContent>
            <TabsContent value="male" className="mt-4">
              <LeaderboardTable title="Male" unit={challenge.unit} submissions={male} sortDirection={challenge.sortDirection} />
            </TabsContent>
          </Tabs>
        </section>

        <section className="mt-10" aria-label="Create your own leaderboard">
          <Card className="p-6 hover-scale">
            <h2 className="text-2xl font-bold mb-2">Create your own leaderboard</h2>
            <p className="text-muted-foreground">Host your own challenge with your rules and branding. Free for one leaderboard — create more with a $9.99 AUD/month plan.</p>
            <a href="/auth" className="story-link mt-3 inline-block">Get started</a>
          </Card>
        </section>
      </main>
    </>
  );
}
