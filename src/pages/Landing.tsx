import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, BarChart3, Zap, Star, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com';

  // Redirect authenticated users to dashboard and clean up OAuth tokens
  useEffect(() => {
    if (user && !loading) {
      // Clean up OAuth hash fragments if present
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Beautiful, Tailored Leaderboards | LeaderStack</title>
        <meta name="description" content="Design stunning leaderboards for competitions, challenges, and tracking. Free tier available with premium features." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Header Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">LeaderStack</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')} variant="default">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate('/auth')} variant="ghost">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')} variant="default">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 1000+ organizations
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Design Beautiful,
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
                Tailored Leaderboards
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Create stunning leaderboards for competitions, fitness challenges, sales tracking, and more. 
              Engage your community with beautiful, interactive rankings that drive results.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={handleGetStarted} className="px-8">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                View Examples
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free forever • No credit card required • Start in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to run engaging competitions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From simple one-off contests to ongoing tracking systems, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover-scale">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Beautiful Design</h3>
              <p className="text-muted-foreground text-sm">
                Stunning, responsive leaderboards that look great on any device
              </p>
            </Card>

            <Card className="p-6 text-center hover-scale">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Submissions</h3>
              <p className="text-muted-foreground text-sm">
                Simple forms for participants to submit scores with proof uploads
              </p>
            </Card>

            <Card className="p-6 text-center hover-scale">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Track participation, view stats, and download reports
              </p>
            </Card>

            <Card className="p-6 text-center hover-scale">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Admin Controls</h3>
              <p className="text-muted-foreground text-sm">
                Full moderation tools, approval workflows, and customization
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect for any competition
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover-scale">
              <h3 className="text-xl font-semibold mb-3">🏋️ Fitness Challenges</h3>
              <p className="text-muted-foreground mb-4">
                Track workouts, personal bests, and team challenges. Perfect for gyms, sports clubs, and fitness communities.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Weight lifting competitions</li>
                <li>• Running challenges</li>
                <li>• Team fitness goals</li>
              </ul>
            </Card>

            <Card className="p-6 hover-scale">
              <h3 className="text-xl font-semibold mb-3">💼 Sales Competitions</h3>
              <p className="text-muted-foreground mb-4">
                Motivate your sales team with engaging leaderboards and friendly competition.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Monthly sales targets</li>
                <li>• Lead generation contests</li>
                <li>• Team performance tracking</li>
              </ul>
            </Card>

            <Card className="p-6 hover-scale">
              <h3 className="text-xl font-semibold mb-3">🎮 Gaming Tournaments</h3>
              <p className="text-muted-foreground mb-4">
                Host esports tournaments, speedrun competitions, and gaming challenges.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tournament brackets</li>
                <li>• High score tracking</li>
                <li>• Community competitions</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 relative">
              <Badge className="mb-4">Free</Badge>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-4xl font-bold mb-6">
                $0
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>1 leaderboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Unlimited participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Community support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                Get Started
              </Button>
            </Card>

            <Card className="p-8 relative border-primary">
              <Badge className="mb-4 bg-primary">Most Popular</Badge>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-6">
                $9.99
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Unlimited leaderboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Custom branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Export data</span>
                </li>
              </ul>
              <Button className="w-full" onClick={handleGetStarted}>
                Start Free Trial
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to create your first leaderboard?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using LeaderStack to drive engagement and results.
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted} className="px-8">
            Get Started Free
          </Button>
        </div>
      </section>
    </>
  );
}