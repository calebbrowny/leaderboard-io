import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Users, BarChart3, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
  owner_user_id: string;
}

export default function Manage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const canonical = typeof window !== 'undefined' ? window.location.href : `https://example.com/manage/${slug}`;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && slug) {
      loadLeaderboard();
    }
  }, [user, slug]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('slug', slug)
        .eq('owner_user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - either doesn't exist or not owned by user
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      navigate('/dashboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  if (loading || loadingLeaderboard || !leaderboard) {
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="default">Active</Badge>
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
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Manage Submissions</h3>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No submissions yet</h4>
                <p className="text-muted-foreground mb-4">
                  Share your leaderboard link to start receiving submissions.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/leaderboard/${leaderboard.slug}`)}
                >
                  Copy Leaderboard Link
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Participants</h3>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No participants yet</h4>
                <p className="text-muted-foreground">
                  Participants will appear here once they submit to your leaderboard.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Leaderboard Settings</h3>
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
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}