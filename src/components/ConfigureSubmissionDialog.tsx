import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Leaderboard {
  id: string;
  requires_verification: boolean;
  auto_approve: boolean;
  smart_time_parsing: boolean;
  submissions_per_user?: number;
  metric_type: string;
}

interface ConfigureSubmissionDialogProps {
  leaderboard: Leaderboard;
  onUpdate: () => void;
  children: React.ReactNode;
}

export function ConfigureSubmissionDialog({ leaderboard, onUpdate, children }: ConfigureSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    requires_verification: leaderboard.requires_verification,
    auto_approve: leaderboard.auto_approve,
    smart_time_parsing: leaderboard.smart_time_parsing,
    submissions_per_user: leaderboard.submissions_per_user || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('leaderboards')
        .update({
          requires_verification: formData.requires_verification,
          auto_approve: formData.auto_approve,
          smart_time_parsing: formData.smart_time_parsing,
          submissions_per_user: formData.submissions_per_user,
        })
        .eq('id', leaderboard.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission settings updated successfully!",
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating submission settings:', error);
      toast({
        title: "Error",
        description: "Failed to update submission settings. Please try again.",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Submission Settings</DialogTitle>
          <DialogDescription>
            Update approval requirements and submission limits
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="requires_verification"
                checked={formData.requires_verification}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, requires_verification: Boolean(checked) }))
                }
              />
              <div>
                <Label htmlFor="requires_verification" className="text-sm font-medium">
                  Require submission verification
                </Label>
                <p className="text-sm text-muted-foreground">
                  Submissions will need approval before appearing on the leaderboard
                </p>
              </div>
            </div>

            {formData.requires_verification && (
              <div className="flex items-start space-x-3 ml-6">
                <Checkbox
                  id="auto_approve"
                  checked={formData.auto_approve}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, auto_approve: Boolean(checked) }))
                  }
                />
                <div>
                  <Label htmlFor="auto_approve" className="text-sm font-medium">
                    Auto-approve submissions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve submissions that meet basic criteria
                  </p>
                </div>
              </div>
            )}

            {leaderboard.metric_type === 'time' && (
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
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}