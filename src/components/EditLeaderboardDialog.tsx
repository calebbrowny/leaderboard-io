import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Leaderboard {
  id: string;
  title: string;
  description?: string;
  rules?: string;
  metric_type: 'time' | 'reps' | 'distance' | 'weight';
  sort_direction: 'asc' | 'desc';
  unit?: string;
}

interface EditLeaderboardDialogProps {
  leaderboard: Leaderboard;
  onUpdate: () => void;
  children: React.ReactNode;
}

export function EditLeaderboardDialog({ leaderboard, onUpdate, children }: EditLeaderboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: leaderboard.title,
    description: leaderboard.description || "",
    rules: leaderboard.rules || "",
    metric_type: leaderboard.metric_type,
    sort_direction: leaderboard.sort_direction,
    unit: leaderboard.unit || "",
  });

  // Time input state for dropdown-based time entry
  const [timeInput, setTimeInput] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Updating leaderboard:', leaderboard.id, formData);
      
      const { data, error } = await supabase
        .from('leaderboards')
        .update({
          title: formData.title,
          description: formData.description || null,
          rules: formData.rules || null,
          metric_type: formData.metric_type,
          sort_direction: formData.sort_direction,
          unit: formData.unit || null,
        })
        .eq('id', leaderboard.id)
        .select();

      console.log('Update result:', { data, error });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Leaderboard updated successfully!",
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to update leaderboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Leaderboard</DialogTitle>
          <DialogDescription>
            Update your leaderboard details and configuration
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric_type">Metric Type</Label>
                <Select value={formData.metric_type} onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value as any }))}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="reps">Number/Count/Reps</SelectItem>
                    <SelectItem value="time">Time Duration</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., kg, lbs, minutes, points"
                />
              </div>
            </div>

            {/* Time-based input system when Time Duration is selected */}
            {formData.metric_type === 'time' && (
              <div className="space-y-3">
                <Label>Time Entry Format</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="hours" className="text-sm">Hours</Label>
                    <Select value={timeInput.hours.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, hours: parseInt(value) }))}>
                      <SelectTrigger className="bg-background z-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50 max-h-48">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="minutes" className="text-sm">Minutes</Label>
                    <Select value={timeInput.minutes.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, minutes: parseInt(value) }))}>
                      <SelectTrigger className="bg-background z-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50 max-h-48">
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="seconds" className="text-sm">Seconds</Label>
                    <Select value={timeInput.seconds.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, seconds: parseInt(value) }))}>
                      <SelectTrigger className="bg-background z-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50 max-h-48">
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Users will enter times using dropdown selectors instead of typing
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="sort_direction">Ranking Order</Label>
              <Select value={formData.sort_direction} onValueChange={(value) => setFormData(prev => ({ ...prev, sort_direction: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Highest scores win (descending)</SelectItem>
                  <SelectItem value="asc">Lowest scores win (ascending)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rules">Rules and Guidelines</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                rows={4}
                placeholder="Define the rules, submission requirements, and guidelines..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Leaderboard"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}