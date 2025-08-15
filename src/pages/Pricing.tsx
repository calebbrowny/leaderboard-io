import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, ArrowLeft, Zap, Shield, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Pricing() {
  const { user, subscriptionData, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/pricing';

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${user.email}`
        }
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${user.email}`
        }
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to access subscription management. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setCheckingSubscription(true);
    await refreshSubscription();
    setCheckingSubscription(false);
    toast({
      title: "Subscription refreshed",
      description: "Your subscription status has been updated."
    });
  };

  const isPro = subscriptionData?.subscribed && subscriptionData?.subscription_tier !== 'Basic';

  return (
    <>
      <Helmet>
        <title>Pricing — LeaderStack</title>
        <meta name="description" content="Simple, transparent pricing for LeaderStack. Start free and upgrade when you're ready to scale." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pricing</h1>
              <p className="text-muted-foreground">Simple, transparent pricing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose the perfect plan for your needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with our free tier and upgrade when you're ready to scale your competitions.
          </p>
        </div>

        {user && subscriptionData && (
          <div className="max-w-md mx-auto mb-8">
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? subscriptionData.subscription_tier : "Free"}
                  </Badge>
                  {subscriptionData.subscription_end && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Renews {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRefreshSubscription}
                    disabled={checkingSubscription}
                  >
                    {checkingSubscription ? "Checking..." : "Refresh"}
                  </Button>
                  {isPro && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loading}
                    >
                      Manage
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 relative">
            <Badge variant="secondary" className="mb-4">Free Forever</Badge>
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
                <span>Basic submission tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Image proof uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Public leaderboard pages</span>
              </li>
            </ul>
            
            <Button 
              className="w-full" 
              size="lg"
              variant={!user ? "default" : "outline"}
              onClick={handleGetStarted}
            >
              {!user ? "Get Started Free" : "Current Plan"}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 relative border-primary shadow-lg">
            <Badge className="mb-4">Most Popular</Badge>
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
                <span>Video proof uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Advanced submission management</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Smart time parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Real-time analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Custom branding</span>
              </li>
            </ul>
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={isPro ? handleManageSubscription : handleUpgrade}
              disabled={loading}
            >
              <Crown className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : isPro ? "Manage Subscription" : "Upgrade to Pro"}
            </Button>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12">Everything you need to run amazing competitions</h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Lightning Fast Setup</h4>
              <p className="text-muted-foreground text-sm">
                Create a leaderboard in minutes with our intuitive interface
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Secure & Reliable</h4>
              <p className="text-muted-foreground text-sm">
                Built on enterprise-grade infrastructure with 99.9% uptime
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Powerful Analytics</h4>
              <p className="text-muted-foreground text-sm">
                Track engagement and performance with detailed insights
              </p>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
              </p>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Do you offer refunds?</h4>
              <p className="text-muted-foreground text-sm">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, debit cards, and PayPal through our secure payment processor.
              </p>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <Card className="p-12 bg-gradient-to-r from-primary/5 to-accent/5 border-none">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of organizations using LeaderStack to engage their communities
            </p>
            <Button size="lg" onClick={handleGetStarted}>
              <Users className="w-4 h-4 mr-2" />
              {user ? "Go to Dashboard" : "Start Free Today"}
            </Button>
          </Card>
        </div>
      </main>
    </>
  );
}