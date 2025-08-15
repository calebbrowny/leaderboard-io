import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/pricing';

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleUpgrade = () => {
    // This will later integrate with Stripe
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // For now, just redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Pricing — LeaderStack</title>
        <meta name="description" content="Simple, transparent pricing for beautiful leaderboards. Start free, upgrade when you need more." />
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
                <span>Basic submission forms</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>File upload support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Community support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Mobile responsive</span>
              </li>
            </ul>
            
            <Button variant="outline" className="w-full" onClick={handleGetStarted}>
              Get Started Free
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 relative border-primary">
            <Badge className="mb-4 bg-primary">
              <Crown className="w-4 h-4 mr-1" />
              Most Popular
            </Badge>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-6">
              $9.99
              <span className="text-lg font-normal text-muted-foreground">/month</span>
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span><strong>Unlimited leaderboards</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Custom branding & colors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Advanced analytics & reporting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Data export (CSV, Excel)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Priority email support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Custom domain support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Advanced submission workflows</span>
              </li>
            </ul>
            
            <Button className="w-full" onClick={handleUpgrade}>
              Start Pro Trial
            </Button>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Can I upgrade or downgrade at any time?</h4>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Pro at any time. If you downgrade, you'll keep access to Pro features until the end of your billing period.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">What happens to my data if I cancel?</h4>
              <p className="text-muted-foreground">
                Your leaderboards and data remain accessible for 30 days after cancellation. You can export all your data before canceling.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">Do you offer refunds?</h4>
              <p className="text-muted-foreground">
                We offer a 14-day money-back guarantee for new Pro subscribers. Just contact our support team.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
              <p className="text-muted-foreground">
                No setup fees, no hidden costs. Just simple monthly pricing that scales with your needs.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of organizations already using LeaderStack.
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            Create Your First Leaderboard
          </Button>
        </div>
      </main>
    </>
  );
}