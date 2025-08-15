import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Users, BarChart3, ExternalLink, Trash2, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubmissionManagement } from "@/components/SubmissionManagement";

interface Leaderboard {
  id: string;
  title: string;
  description?: string;
  slug: string;
  metric_type: 'time' | 'reps' | 'distance' | 'weight';
  sort_direction: 'asc' | 'desc';
  unit?: string;
  rules?: string;
  owner_user_id: string;
  created_at: string;
  requires_verification: boolean;
  auto_approve: boolean;
  smart_time_parsing: boolean;
  submissions_per_user?: number;
  end_date?: string;
  submission_deadline?: string;
}

interface LeaderboardStats {
  total_submissions: number;
  pending_submissions: number;
  approved_submissions: number;
  unique_participants: number;
}

export default function Manage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeaderboardStats>({
    total_submissions: 0,
    pending_submissions: 0,
    approved_submissions: 0,
    unique_participants: 0
  });
  const [deleting, setDeleting] = useState(false);

  const canonical = typeof window !== 'undefined' ? window.location.href : `https://example.com/manage/${slug}`;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && slug) {
      loadLeaderboard();
    }
  }, [user, slug]);

  const loadLeaderboard = async () => {
    if (!user?.id || !slug) return;

    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('slug', slug)
        .eq('owner_user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading leaderboard:', error);
        navigate('/dashboard');
        return;
      }

      setLeaderboard(data);
      
      // Load stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_leaderboard_stats', { leaderboard_uuid: data.id });

      if (!statsError && statsData?.[0]) {
        setStats({
          total_submissions: Number(statsData[0].total_submissions) || 0,
          pending_submissions: Number(statsData[0].pending_submissions) || 0,
          approved_submissions: Number(statsData[0].approved_submissions) || 0,
          unique_participants: Number(statsData[0].unique_participants) || 0
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!leaderboard || !user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this leaderboard? This action cannot be undone.');
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('leaderboards')
        .delete()
        .eq('id', leaderboard.id)
        .eq('owner_user_id', user.id);

      if (error) throw error;

      toast({
        title: "Leaderboard deleted",
        description: "Your leaderboard has been successfully deleted."
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to delete leaderboard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyLeaderboardLink = () => {
    if (!leaderboard) return;
    navigator.clipboard.writeText(`${window.location.origin}/leaderboard/${leaderboard.slug}`);
    toast({ 
      title: "Link copied!", 
      description: "Leaderboard link copied to clipboard" 
    });
  };

  if (authLoading || loading || !leaderboard) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage {leaderboard.title} — LeaderStack</title>
        <meta name="description" content={`Manage your ${leaderboard.title} leaderboard`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{leaderboard.title}</h1>
                <p className="text-muted-foreground">Manage your leaderboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/leaderboard/${leaderboard.slug}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unique_participants}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_submissions}</p>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending_submissions}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved_submissions}</p>
                <p className="text-sm text-muted-foreground">Approved Entries</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Leaderboard Details */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Leaderboard Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Title:</span> {leaderboard.title}</div>
                <div><span className="text-muted-foreground">Slug:</span> {leaderboard.slug}</div>
                <div><span className="text-muted-foreground">Description:</span> {leaderboard.description || "No description"}</div>
                <div><span className="text-muted-foreground">Created:</span> {new Date(leaderboard.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Scoring Configuration</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Metric Type:</span> {leaderboard.metric_type}</div>
                <div><span className="text-muted-foreground">Unit:</span> {leaderboard.unit || "None"}</div>
                <div><span className="text-muted-foreground">Sort Direction:</span> {leaderboard.sort_direction === 'desc' ? 'Highest wins' : 'Lowest wins'}</div>
                <div>
                  <span className="text-muted-foreground">Verification:</span>{' '}
                  {leaderboard.requires_verification ? (
                    <Badge variant="secondary">Manual approval required</Badge>
                  ) : (
                    <Badge variant="default">Auto-approved</Badge>
                  )}
                </div>
                {leaderboard.smart_time_parsing && leaderboard.metric_type === 'time' && (
                  <div><span className="text-muted-foreground">Smart Time Parsing:</span> Enabled</div>
                )}
              </div>
            </div>
          </div>
          
          {leaderboard.rules && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Rules</h3>
              <p className="text-sm text-muted-foreground">{leaderboard.rules}</p>
            </div>
          )}
        </Card>

        {/* Management Tabs */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <SubmissionManagement leaderboardId={leaderboard.id} />
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>View and manage participants in your leaderboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No participants yet</p>
                  <p className="text-sm mt-2">Participants will appear here once they submit to your leaderboard</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={copyLeaderboardLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Leaderboard Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard Settings</CardTitle>
                <CardDescription>Manage your leaderboard configuration and data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Edit Details</h4>
                      <p className="text-sm text-muted-foreground">Update title, description, and rules</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Submission Settings</h4>
                      <p className="text-sm text-muted-foreground">Configure approval requirements and limits</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-muted-foreground">Download submissions and participant data</p>
                    </div>
                    <Button variant="outline" size="sm">Export</Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Leaderboard</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete this leaderboard and all data</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}