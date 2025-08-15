import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Search, Save, GripVertical, Edit2, Video, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Submission {
  id: string;
  full_name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  value_display: string;
  value_raw: number;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  proof_url?: string;
  video_url?: string;
  submitted_at: string;
  manual_rank?: number;
  is_manual_entry?: boolean;
}

interface EnhancedSubmissionManagementProps {
  leaderboardId: string;
  metricType: string;
  unit?: string;
  sortDirection: 'asc' | 'desc';
}

interface SortableRowProps {
  submission: Submission;
  rank: number;
  onEdit: (submission: Submission) => void;
  onDelete: (id: string) => void;
  onSave: (submission: Submission) => void;
  isEditing: boolean;
  editingData: Partial<Submission>;
  setEditingData: (data: Partial<Submission>) => void;
  metricType: string;
}

function SortableRow({ 
  submission, 
  rank, 
  onEdit, 
  onDelete, 
  onSave,
  isEditing,
  editingData,
  setEditingData,
  metricType
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: submission.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank.toString();
  };

  // Time input dropdowns for editing
  const parseTimeValue = (timeString: string) => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      return { hours: 0, minutes: parseInt(parts[0]) || 0, seconds: parseInt(parts[1]) || 0 };
    } else if (parts.length === 3) {
      return { hours: parseInt(parts[0]) || 0, minutes: parseInt(parts[1]) || 0, seconds: parseInt(parts[2]) || 0 };
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeInput, setTimeInput] = useState(() => {
    if (metricType === 'time' && isEditing && editingData.value_display) {
      return parseTimeValue(editingData.value_display);
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  });

  useEffect(() => {
    if (metricType === 'time' && isEditing) {
      const totalMs = ((timeInput.hours * 60 + timeInput.minutes) * 60 + timeInput.seconds) * 1000;
      const display = timeInput.hours > 0 
        ? `${timeInput.hours}:${String(timeInput.minutes).padStart(2, "0")}:${String(timeInput.seconds).padStart(2, "0")}` 
        : `${timeInput.minutes}:${String(timeInput.seconds).padStart(2, "0")}`;
      
      setEditingData({
        ...editingData,
        value_raw: totalMs,
        value_display: display
      });
    }
  }, [timeInput, metricType, isEditing]);

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={isDragging ? "bg-muted/50" : ""}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-lg">{getRankDisplay(rank)}</span>
        </div>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="space-y-1">
            <Input
              value={editingData.full_name || ""}
              onChange={(e) => setEditingData({ ...editingData, full_name: e.target.value })}
              className="text-sm"
            />
            <Input
              value={editingData.email || ""}
              onChange={(e) => setEditingData({ ...editingData, email: e.target.value })}
              className="text-xs"
              type="email"
            />
            <Select 
              value={editingData.gender || submission.gender} 
              onValueChange={(value: 'male' | 'female' | 'other') => setEditingData({ ...editingData, gender: value })}
            >
              <SelectTrigger className="h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <div className="font-medium">{submission.full_name}</div>
            <div className="text-sm text-muted-foreground">{submission.email}</div>
            <div className="text-xs text-muted-foreground">{submission.gender}</div>
          </div>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          metricType === 'time' ? (
            <div className="grid grid-cols-3 gap-1">
              <div>
                <Label className="text-xs">H</Label>
                <Select value={timeInput.hours.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, hours: parseInt(value) }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-32">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">M</Label>
                <Select value={timeInput.minutes.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, minutes: parseInt(value) }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-32">
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">S</Label>
                <Select value={timeInput.seconds.toString()} onValueChange={(value) => setTimeInput(prev => ({ ...prev, seconds: parseInt(value) }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-32">
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <Input
              value={editingData.value_display || ""}
              onChange={(e) => {
                const value = e.target.value;
                let raw = 0;
                
                if (metricType === 'reps') {
                  raw = parseInt(value) || 0;
                } else if (metricType === 'distance') {
                  raw = parseFloat(value) || 0;
                } else if (metricType === 'weight') {
                  raw = Math.round((parseFloat(value) || 0) * 1000); // Convert kg to grams
                }
                
                setEditingData({ ...editingData, value_display: value, value_raw: raw });
              }}
              className="text-sm font-mono"
            />
          )
        ) : (
          <div className="font-mono text-lg">{submission.value_display}</div>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
        </div>
        {submission.is_manual_entry && (
          <div className="text-xs text-muted-foreground">Manual entry</div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {submission.video_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(submission.video_url, '_blank')}
            >
              <Video className="w-3 h-3" />
            </Button>
          )}
          {submission.proof_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(submission.proof_url, '_blank')}
            >
              <Image className="w-3 h-3" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {isEditing ? (
            <Button
              size="sm"
              onClick={() => onSave(submission)}
              className="h-7 px-2"
            >
              <Save className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(submission)}
              className="h-7 px-2"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {submission.full_name}'s submission? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(submission.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function EnhancedSubmissionManagement({ 
  leaderboardId, 
  metricType, 
  unit, 
  sortDirection 
}: EnhancedSubmissionManagementProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Submission>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntryData, setNewEntryData] = useState<{
    full_name: string;
    email: string;
    gender: 'male' | 'female' | 'other';
    value_display: string;
    value_raw: number;
  }>({
    full_name: "",
    email: "",
    gender: "male",
    value_display: "",
    value_raw: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSubmissions();
  }, [leaderboardId]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('leaderboard_id', leaderboardId)
        .eq('status', 'APPROVED')
        .order('manual_rank', { ascending: true, nullsFirst: false })
        .order('value_raw', { ascending: sortDirection === 'asc' });

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = submissions.findIndex((item) => item.id === active.id);
    const newIndex = submissions.findIndex((item) => item.id === over.id);

    const newSubmissions = arrayMove(submissions, oldIndex, newIndex);
    setSubmissions(newSubmissions);

    // Update manual rankings in database
    try {
      const updates = newSubmissions.map((submission, index) => ({
        id: submission.id,
        manual_rank: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('submissions')
          .update({ manual_rank: update.manual_rank })
          .eq('id', update.id);
      }

      toast({
        title: "Rankings updated",
        description: "Manual rankings have been saved"
      });
    } catch (error) {
      console.error('Error updating rankings:', error);
      toast({
        title: "Error",
        description: "Failed to update rankings",
        variant: "destructive"
      });
      loadSubmissions(); // Reload to revert changes
    }
  };

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditingData(submission);
  };

  const handleSave = async (submission: Submission) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          full_name: editingData.full_name,
          email: editingData.email,
          gender: editingData.gender,
          value_display: editingData.value_display,
          value_raw: editingData.value_raw,
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry updated successfully"
      });

      setEditingId(null);
      setEditingData({});
      loadSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry deleted successfully"
      });

      loadSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
    }
  };

  const handleAddEntry = async () => {
    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          leaderboard_id: leaderboardId,
          full_name: newEntryData.full_name,
          email: newEntryData.email,
          gender: newEntryData.gender as 'male' | 'female' | 'other',
          value_display: newEntryData.value_display,
          value_raw: newEntryData.value_raw,
          status: 'APPROVED' as const,
          is_manual_entry: true,
          submitted_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual entry added successfully"
      });

      setShowAddDialog(false);
      setNewEntryData({
        full_name: "",
        email: "",
        gender: "male" as const,
        value_display: "",
        value_raw: 0
      });
      loadSubmissions();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add entry",
        variant: "destructive"
      });
    }
  };

  const filteredSubmissions = submissions.filter(submission =>
    submission.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Header with search and add button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advanced Submission Management</span>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Manual Entry</DialogTitle>
                  <DialogDescription>
                    Manually add a new entry to the leaderboard
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={newEntryData.full_name}
                        onChange={(e) => setNewEntryData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newEntryData.email}
                        onChange={(e) => setNewEntryData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select 
                      value={newEntryData.gender} 
                      onValueChange={(value: 'male' | 'female' | 'other') => setNewEntryData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Result ({unit || metricType})</Label>
                    <Input
                      value={newEntryData.value_display}
                      onChange={(e) => {
                        const value = e.target.value;
                        let raw = 0;
                        
                        if (metricType === 'time') {
                          // Parse time format
                          const parts = value.split(':');
                          if (parts.length === 2) {
                            const [minutes, seconds] = parts.map(p => parseInt(p) || 0);
                            raw = (minutes * 60 + seconds) * 1000;
                          } else if (parts.length === 3) {
                            const [hours, minutes, seconds] = parts.map(p => parseInt(p) || 0);
                            raw = ((hours * 60 + minutes) * 60 + seconds) * 1000;
                          }
                        } else if (metricType === 'reps') {
                          raw = parseInt(value) || 0;
                        } else if (metricType === 'distance') {
                          raw = parseFloat(value) || 0;
                        } else if (metricType === 'weight') {
                          raw = Math.round((parseFloat(value) || 0) * 1000);
                        }
                        
                        setNewEntryData(prev => ({ ...prev, value_display: value, value_raw: raw }));
                      }}
                      placeholder={metricType === 'time' ? 'mm:ss or hh:mm:ss' : 'Enter value'}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddEntry}
                      disabled={!newEntryData.full_name || !newEntryData.email || !newEntryData.value_display}
                    >
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table with Drag & Drop */}
      <Card>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {submissions.length === 0 ? "No submissions yet" : "No submissions match your search"}
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext items={filteredSubmissions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {filteredSubmissions.map((submission, index) => (
                      <SortableRow
                        key={submission.id}
                        submission={submission}
                        rank={index + 1}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSave={handleSave}
                        isEditing={editingId === submission.id}
                        editingData={editingData}
                        setEditingData={setEditingData}
                        metricType={metricType}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}