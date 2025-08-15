import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, Filter, Search, Video, Image, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  full_name: string;
  email: string;
  gender: string;
  value_display: string;
  value_raw: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proof_url?: string;
  video_url?: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  submission_metadata?: any;
}

interface SubmissionManagementProps {
  leaderboardId: string;
}

export function SubmissionManagement({ leaderboardId }: SubmissionManagementProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [leaderboardId]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('leaderboard_id', leaderboardId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Approved",
        description: "Submission has been approved and added to the leaderboard"
      });

      loadSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (submissionId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: "Submission has been rejected"
      });

      loadSubmissions();
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || submission.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading submissions...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {submissions.length === 0 ? "No submissions yet" : "No submissions match your filters"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.full_name}</div>
                        <div className="text-sm text-muted-foreground">{submission.email}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {submission.gender}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-lg">{submission.value_display}</div>
                      {submission.submission_metadata?.smart_parsing_used && (
                        <div className="text-xs text-muted-foreground">
                          Original: {submission.submission_metadata.original_input}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {submission.video_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.video_url, '_blank')}
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        )}
                        {submission.proof_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.proof_url, '_blank')}
                          >
                            <Image className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submission Details</DialogTitle>
                              <DialogDescription>
                                Review and manage this submission
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Participant</h4>
                                    <p>{selectedSubmission.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedSubmission.email}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Result</h4>
                                    <p className="text-2xl font-mono">{selectedSubmission.value_display}</p>
                                  </div>
                                </div>
                                
                                {selectedSubmission.status === 'PENDING' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => handleApprove(selectedSubmission.id)}
                                      disabled={isProcessing}
                                      className="flex-1"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" className="flex-1">
                                          <X className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Reject Submission</DialogTitle>
                                          <DialogDescription>
                                            Please provide a reason for rejecting this submission.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <Textarea
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              variant="destructive"
                                              onClick={() => handleReject(selectedSubmission.id, rejectionReason)}
                                              disabled={!rejectionReason.trim() || isProcessing}
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                                
                                {selectedSubmission.status === 'REJECTED' && selectedSubmission.rejection_reason && (
                                  <div>
                                    <h4 className="font-medium text-destructive">Rejection Reason</h4>
                                    <p className="text-sm">{selectedSubmission.rejection_reason}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {submission.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(submission.id)}
                              disabled={isProcessing}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubmission(submission)}
                              disabled={isProcessing}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}