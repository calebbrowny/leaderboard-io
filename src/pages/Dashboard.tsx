import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, BarChart3, Users, ExternalLink, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserLeaderboard {
  id: string;
  title: string;
  description: string;
  slug: string;
  metric_type: string;
  created_at: string;
  // We'll track submissions count later
  submissions_count?: number;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [leaderboards, setLeaderboards] = useState<UserLeaderboard[]>([]);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/dashboard';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserLeaderboards();
      checkSubscription();
    }
  }, [user]);

  const loadUserLeaderboards = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('owner_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaderboards(data || []);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoadingLeaderboards(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscription_tier, subscribed')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      setSubscriptionTier(data?.subscribed ? data.subscription_tier : null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleCreateNew = () => {
    const freeLimit = 1;
    const isPaid = subscriptionTier && subscriptionTier !== 'free';
    
    if (!isPaid && leaderboards.length >= freeLimit) {
      // Redirect to pricing/upgrade
      navigate('/pricing');
      return;
    }
    
    navigate('/create');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  const freeLimit = 1;
  const isPaid = subscriptionTier && subscriptionTier !== 'free';
  const canCreateMore = isPaid || leaderboards.length < freeLimit;

  return (
    <>
      <Helmet>
        <title>Dashboard — LeaderStack</title>
        <meta name="description" content="Manage your leaderboards and view analytics." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {!isPaid && (
                <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
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
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leaderboards.length}</p>
                <p className="text-sm text-muted-foreground">Active Leaderboards</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
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
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Plan</p>
                <Badge variant={isPaid ? "default" : "secondary"}>
                  {isPaid ? subscriptionTier : "Free"}
                </Badge>
              </div>
              {!isPaid && (
                <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                  Upgrade
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Create New Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Leaderboards</h2>
            <Button onClick={handleCreateNew} disabled={!canCreateMore}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          {!canCreateMore && (
            <Card className="p-4 border-amber-200 bg-amber-50 mb-6">
              <p className="text-sm text-amber-800">
                You've reached the free plan limit of {freeLimit} leaderboard. 
                <Button variant="link" className="p-0 ml-1 h-auto text-amber-800" onClick={() => navigate('/pricing')}>
                  Upgrade to Pro 
                </Button> 
                for unlimited leaderboards.
              </p>
            </Card>
          )}
        </div>

        {/* Leaderboards Grid */}
        {loadingLeaderboards ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : leaderboards.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leaderboards yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first leaderboard to start tracking competitions and engaging your community.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Leaderboard
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaderboards.map((leaderboard) => (
              <Card key={leaderboard.id} className="p-6 hover-scale">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate">{leaderboard.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {leaderboard.metric_type}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {leaderboard.description || "No description provided"}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>0 participants</span>
                  <span>Created {new Date(leaderboard.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/leaderboard/${leaderboard.slug}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/manage/${leaderboard.slug}`)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}