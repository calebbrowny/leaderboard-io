import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardTable, LeaderboardSubmission, SortDirection } from "@/components/LeaderboardTable";
import { EnhancedSubmissionForm, LeaderboardMeta } from "@/components/EnhancedSubmissionForm";
import { StatsBar, Stats } from "@/components/StatsBar";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Leaderboard {
  id: string;
  title: string;
  description: string;
  slug: string;
  metric_type: string;
  sort_direction: string;
  unit: string;
  rules: string;
  created_at: string;
  logo_url?: string;
  smart_time_parsing: boolean;
}

export default function LeaderboardView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [sampleSubmissions, setSampleSubmissions] = useState<LeaderboardSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const canonical = typeof window !== 'undefined' ? window.location.href : `https://example.com/leaderboard/${slug}`;

  useEffect(() => {
    if (slug) {
      loadLeaderboard();
    }
  }, [slug]);

  const loadLeaderboard = async () => {
    try {
      // Load leaderboard details
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          navigate('/404');
          return;
        }
        throw error;
      }

      setLeaderboard(data);
      
      // Load public submissions using the secure view that hides sensitive data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('public_submissions')
        .select('*')
        .eq('leaderboard_id', data.id)
        .order('value_raw', { ascending: data.sort_direction === 'asc' });

      if (submissionsError) {
        console.error('Error loading submissions:', submissionsError);
      } else if (submissionsData) {
        // Transform the secure data to match the expected format
        const transformedSubmissions = submissionsData.map(sub => ({
          id: sub.id,
          fullName: sub.display_name, // Now shows initials only for privacy
          email: '', // Hidden for privacy
          valueRaw: sub.value_raw,
          valueDisplay: sub.value_display,
          gender: sub.gender,
          submittedAt: sub.submitted_at,
          approvedAt: sub.approved_at || sub.submitted_at,
          proofUrl: sub.proof_url || null,
          videoUrl: sub.video_url || null
        }));
        
        setSampleSubmissions(transformedSubmissions);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (subs: LeaderboardSubmission[], sortDirection: SortDirection): Stats => {
    const total = subs.length;
    const approved = subs.length;
    if (total === 0) return { total, approved, bestDisplay: null, avgDisplay: null, lastUpdated: null };
    
    const sorted = [...subs].sort((a, b) => 
      sortDirection === "asc" ? a.valueRaw - b.valueRaw : b.valueRaw - a.valueRaw
    );
    const best = sorted[0];
    const avgRaw = Math.round(subs.reduce((acc, s) => acc + s.valueRaw, 0) / subs.length);
    const bestDisplay = best?.valueDisplay || null;
    const avgDisplay = avgRaw ? avgRaw.toString() : null;
    const latest = [...subs].sort((a, b) => 
      new Date(b.approvedAt ?? b.submittedAt).getTime() - new Date(a.approvedAt ?? a.submittedAt).getTime()
    )[0];
    const lastUpdated = latest ? new Date(latest.approvedAt ?? latest.submittedAt).toLocaleString() : null;
    
    return { total, approved, bestDisplay, avgDisplay, lastUpdated };
  };

  // Remove the static sample data and use dynamic submissions
  const stats = useMemo(() => {
    if (!leaderboard) return { total: 0, approved: 0, bestDisplay: null, avgDisplay: null, lastUpdated: null };
    return computeStats(sampleSubmissions, leaderboard.sort_direction as SortDirection);
  }, [sampleSubmissions, leaderboard]);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Leaderboard not found</h1>
        <p className="text-muted-foreground mt-2">This leaderboard may have been deleted or moved.</p>
      </div>
    );
  }

  const leaderboardMeta: LeaderboardMeta = {
    id: leaderboard.id,
    title: leaderboard.title,
    metricType: leaderboard.metric_type as any,
    units: leaderboard.unit,
    
    smartTimeParsing: leaderboard.smart_time_parsing,
  };

  return (
    <>
      <Helmet>
        <title>{leaderboard.title} — LeaderStack</title>
        <meta name="description" content={leaderboard.description || `Live leaderboard for ${leaderboard.title}`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="py-10 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Live Leaderboard
            </Badge>
            {leaderboard.logo_url && (
              <div className="mb-6">
                <img 
                  src={leaderboard.logo_url} 
                  alt={`${leaderboard.title} logo`}
                  className="h-16 w-auto mx-auto"
                />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              {leaderboard.title}
            </h1>
            {leaderboard.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {leaderboard.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Tracking: {leaderboard.metric_type}</span>
              {leaderboard.unit && <span>• Unit: {leaderboard.unit}</span>}
              <span>• {leaderboard.sort_direction === 'desc' ? 'Highest wins' : 'Lowest wins'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container pb-16">
        <div className="py-8">
          <StatsBar stats={stats} />
        </div>

        {/* Submit Your Score */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Submit Your Score</h2>
            <EnhancedSubmissionForm leaderboard={leaderboardMeta} />
          </Card>
        </div>

        {/* Rules */}
        {leaderboard.rules && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Rules & Guidelines</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{leaderboard.rules}</p>
          </Card>
        )}

        {/* Leaderboard */}
        <section aria-label="Leaderboard">
          {sampleSubmissions.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">
                Be the first to submit your score!
              </p>
            </Card>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Participants</TabsTrigger>
                <TabsTrigger value="male">Male</TabsTrigger>
                <TabsTrigger value="female">Female</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <LeaderboardTable 
                  title="All Participants" 
                  unit={leaderboard.unit} 
                  submissions={sampleSubmissions} 
                  sortDirection={leaderboard.sort_direction as SortDirection} 
                />
              </TabsContent>
              <TabsContent value="male" className="mt-4">
                <LeaderboardTable 
                  title="Male" 
                  unit={leaderboard.unit} 
                  submissions={[]} 
                  sortDirection={leaderboard.sort_direction as SortDirection} 
                />
              </TabsContent>
              <TabsContent value="female" className="mt-4">
                <LeaderboardTable 
                  title="Female" 
                  unit={leaderboard.unit} 
                  submissions={[]} 
                  sortDirection={leaderboard.sort_direction as SortDirection} 
                />
              </TabsContent>
            </Tabs>
          )}
        </section>

        {/* Footer CTA */}
        <section className="mt-16" aria-label="Create your own leaderboard">
          <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-accent/5">
            <h2 className="text-2xl font-bold mb-2">Create your own leaderboard</h2>
            <p className="text-muted-foreground mb-6">
              Host your own competitions and challenges with beautiful, interactive leaderboards.
            </p>
            <a 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </a>
          </Card>
        </section>
      </main>
    </>
  );
}