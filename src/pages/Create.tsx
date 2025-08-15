import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Trophy, Clock, Shield, Zap, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LeaderboardType = "ongoing" | "one-off";
type MetricType = "time" | "reps" | "distance" | "weight";
type SortDirection = "asc" | "desc";

export default function Create() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ongoing" as LeaderboardType,
    metricType: "reps" as MetricType,
    unit: "",
    sortDirection: "desc" as SortDirection,
    rules: "",
    prizes: "",
    smart_time_parsing: true,
    submissions_per_user: null as number | null,
    end_date: null as string | null,
    submission_deadline: null as string | null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const canonical = typeof window !== 'undefined' ? window.location.href : 'https://example.com/create';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user can create more leaderboards
  useEffect(() => {
    if (user) {
      checkLeaderboardLimit();
    }
  }, [user]);

  const checkLeaderboardLimit = async () => {
    try {
      const { data: leaderboards } = await supabase
        .from('leaderboards')
        .select('id')
        .eq('owner_user_id', user?.id);

      const { data: subscription } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier')
        .eq('user_id', user?.id)
        .single();

      const isPaid = subscription?.subscribed;
      const freeLimit = 1;

      if (!isPaid && (leaderboards?.length || 0) >= freeLimit) {
        toast.error("You've reached the free plan limit. Upgrade to create more leaderboards.");
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const slug = generateSlug(formData.title);
      
      // Check if slug exists
      const { data: existing } = await supabase
        .from('leaderboards')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        toast.error("A leaderboard with this title already exists. Please choose a different title.");
        setIsSubmitting(false);
        return;
      }

      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const logoPath = `logos/${user.id}/${Date.now()}_${logoFile.name}`;
        const { error: logoError } = await supabase.storage
          .from('proofs')
          .upload(logoPath, logoFile);
        
        if (logoError) {
          console.error('Logo upload error:', logoError);
          toast.error("Failed to upload logo. Please try again.");
          setIsSubmitting(false);
          return;
        }
        
        const { data: logoPublicUrl } = supabase.storage
          .from('proofs')
          .getPublicUrl(logoPath);
        logoUrl = logoPublicUrl.publicUrl;
      }

      const { data, error } = await supabase
        .from('leaderboards')
        .insert({
          title: formData.title,
          description: formData.description,
          slug,
          metric_type: formData.metricType,
          sort_direction: formData.sortDirection,
          unit: formData.unit || null,
          rules: formData.rules || null,
          prizes: formData.prizes || null,
          owner_user_id: user.id,
          smart_time_parsing: formData.smart_time_parsing,
          submissions_per_user: formData.submissions_per_user,
          end_date: formData.end_date,
          submission_deadline: formData.submission_deadline,
          logo_url: logoUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Leaderboard created successfully!");
      navigate(`/manage/${slug}`);
    } catch (error) {
      console.error('Error creating leaderboard:', error);
      toast.error("Failed to create leaderboard. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: LeaderboardType) => {
    setFormData(prev => ({ ...prev, type }));
  };

  if (loading || !user) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Leaderboard — LeaderStack</title>
        <meta name="description" content="Create a new leaderboard for your competition or challenge." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Leaderboard</h1>
              <p className="text-muted-foreground">Set up your competition or tracking system</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Leaderboard Type */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Leaderboard Type</h2>
            <RadioGroup value={formData.type} onValueChange={handleTypeChange}>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className={`p-4 cursor-pointer transition-colors ${formData.type === 'ongoing' ? 'border-primary bg-primary/5' : ''}`}>
                  <label className="cursor-pointer">
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="ongoing" id="ongoing" />
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">Ongoing Leaderboard</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Perfect for continuous tracking like gym leaderboards, sales competitions, or long-term challenges.
                    </p>
                  </label>
                </Card>

                <Card className={`p-4 cursor-pointer transition-colors ${formData.type === 'one-off' ? 'border-primary bg-primary/5' : ''}`}>
                  <label className="cursor-pointer">
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="one-off" id="one-off" />
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-medium">One-Off Event</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Ideal for contests, tournaments, or time-limited events with clear start and end dates.
                    </p>
                  </label>
                </Card>
              </div>
            </RadioGroup>
          </Card>

          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Leaderboard Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Monthly Fitness Challenge, Q1 Sales Competition"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your competition, its goals, and what participants should know..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="logo">Logo (optional)</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                {logoFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {logoFile.name} ({(logoFile.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Scoring Configuration */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Scoring Configuration</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metricType">What are you tracking? *</Label>
                <Select value={formData.metricType} onValueChange={(value) => handleInputChange('metricType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reps">Number/Count/Reps</SelectItem>
                    <SelectItem value="time">Time Duration</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="e.g., kg, lbs, minutes, points"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="sortDirection">Ranking Order *</Label>
                <Select value={formData.sortDirection} onValueChange={(value) => handleInputChange('sortDirection', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How should scores be ranked?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest scores win (descending)</SelectItem>
                    <SelectItem value="asc">Lowest scores win (ascending)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Submission Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Submission Settings
            </h2>
            <div className="space-y-6">
              {formData.metricType === 'time' && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="smart_time_parsing"
                    checked={formData.smart_time_parsing}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, smart_time_parsing: Boolean(checked) }))
                    }
                  />
                  <div>
                    <Label htmlFor="smart_time_parsing" className="text-sm font-medium">
                      Smart time parsing
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Accept various time formats like "12mins 30sec", "1h 30m", or "12:30"
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="submissions_per_user">Submissions per user (optional)</Label>
                <Input
                  id="submissions_per_user"
                  type="number"
                  min="1"
                  value={formData.submissions_per_user || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    submissions_per_user: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Limit how many times each person can submit
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Auto-approval enabled:</strong> All submissions will appear immediately on the leaderboard without requiring manual approval.
                </p>
              </div>
            </div>
          </Card>

          {/* Rules and Guidelines */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Rules and Guidelines</h2>
            <div>
              <Label htmlFor="rules">Competition Rules</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => handleInputChange('rules', e.target.value)}
                placeholder="Define the rules, submission requirements, deadlines, and any other important guidelines..."
                rows={4}
              />
            </div>
          </Card>

          {/* Prizes */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Prizes (optional)
            </h2>
            <div>
              <Label htmlFor="prizes">Prize Information</Label>
              <Textarea
                id="prizes"
                value={formData.prizes || ""}
                onChange={(e) => handleInputChange('prizes', e.target.value)}
                placeholder="Describe the prizes, rewards, or recognition for winners (e.g., 1st place: $500, 2nd place: $250, 3rd place: $100)..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Optional: Add details about what participants can win or achieve
              </p>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Leaderboard"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}