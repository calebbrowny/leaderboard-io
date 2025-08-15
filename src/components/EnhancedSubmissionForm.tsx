import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Video, Clock, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
type MetricType = "time" | "reps" | "distance" | "weight";
import { useAuth } from "@/contexts/AuthContext";

export interface LeaderboardMeta {
  id: string;
  title: string;
  metricType: MetricType;
  units?: string | null;
  smartTimeParsing: boolean;
}

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Please enter your full name")
      .refine((v) => !/(fuck|shit|cunt|bitch|asshole|damn)/i.test(v), "Inappropriate words are not allowed"),
    email: z.string().email("Enter a valid email"),
    gender: z.enum(["male", "female", "other"]),
    value: z.string().min(1, "Please enter your result"),
    proofUrl: z.string().url().optional().or(z.literal("")),
    proofFile: z.any().optional(),
    accept: z.boolean().refine((v) => v === true, "You must accept the rules & terms"),
    website: z.string().optional(), // honeypot
  })
  .refine((data) => !data.website, { message: "Invalid", path: ["website"] });

function parseToRawSmart(metric: MetricType, v: string, smartParsing: boolean): { raw: number; display: string } {
  const value = v.trim().toLowerCase();
  
  if (metric === "time") {
    if (smartParsing) {
      // Smart parsing: handle natural language time inputs
      
      // Handle formats like "12mins 30sec", "1h 30m", "90 seconds", "1:30", etc.
      const hourMatch = value.match(/(\d+)\s*(?:h|hour|hours)/);
      const minMatch = value.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/);
      const secMatch = value.match(/(\d+)\s*(?:s|sec|secs|second|seconds)/);
      
      let hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      let minutes = minMatch ? parseInt(minMatch[1]) : 0;
      let seconds = secMatch ? parseInt(secMatch[1]) : 0;
      
      // If no matches found, try colon format
      if (!hourMatch && !minMatch && !secMatch) {
        const parts = value.split(":").map((p) => Number(p));
        if (parts.some((n) => Number.isNaN(n))) throw new Error("Invalid time format");
        
        if (parts.length === 2) [minutes, seconds] = parts as [number, number];
        else if (parts.length === 3) [hours, minutes, seconds] = parts as [number, number, number];
        else throw new Error("Use formats like '12:30', '1:12:30', '12mins 30sec', or '1h 30m'");
      }
      
      const totalMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
      if (totalMs <= 0) throw new Error("Time must be greater than 0");
      
      const display = hours > 0 
        ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` 
        : `${minutes}:${String(seconds).padStart(2, "0")}`;
      
      return { raw: totalMs, display };
    } else {
      // Strict parsing: only hh:mm:ss or mm:ss
      const parts = value.split(":").map((p) => Number(p));
      if (parts.some((n) => Number.isNaN(n))) throw new Error("Invalid time");
      let h = 0, m = 0, s = 0;
      if (parts.length === 2) [m, s] = parts as [number, number];
      else if (parts.length === 3) [h, m, s] = parts as [number, number, number];
      else throw new Error("Use mm:ss or hh:mm:ss format only");
      const ms = ((h * 60 + m) * 60 + s) * 1000;
      const display = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
      return { raw: ms, display };
    }
  }
  
  if (metric === "reps") {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive integer");
    return { raw: n, display: String(n) };
  }
  
  if (metric === "distance") {
    let n = 0;
    const kmMatch = value.match(/([0-9]+(?:\.[0-9]+)?)\s*km/i);
    if (kmMatch) n = parseFloat(kmMatch[1]) * 1000;
    else n = parseFloat(value);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive number (m or km)");
    return { raw: Math.round(n), display: kmMatch ? `${parseFloat(kmMatch[1])} km` : `${n} m` };
  }
  
  // weight -> store grams, accept 0.5 increments
  const kg = parseFloat(value);
  if (!Number.isFinite(kg) || kg <= 0) throw new Error("Enter a positive number (kg)");
  const grams = Math.round(kg * 1000);
  return { raw: grams, display: `${kg} kg` };
}

export function EnhancedSubmissionForm({ leaderboard }: { leaderboard: LeaderboardMeta }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Time input state for dropdown-based time entry
  const [timeInput, setTimeInput] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ 
    resolver: zodResolver(schema), 
    defaultValues: { 
      gender: "male",
      fullName: user?.user_metadata?.full_name || "",
      email: user?.email || ""
    }
  });

  const watchedFile = watch("proofFile");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsUploading(true);
    try {
      console.log('🚀 ULTRA SIMPLE SUBMISSION:', { 
        user: user ? 'LOGGED_IN' : 'ANONYMOUS',
        leaderboard: leaderboard.id 
      });
      
      // Parse the value
      let valueToUse = data.value;
      if (leaderboard.metricType === 'time') {
        valueToUse = `${timeInput.hours}:${timeInput.minutes.toString().padStart(2, '0')}:${timeInput.seconds.toString().padStart(2, '0')}`;
      }
      
      const { raw, display } = parseToRawSmart(leaderboard.metricType, valueToUse, leaderboard.smartTimeParsing);
      console.log('✅ Value parsed:', { raw, display });

      // Handle file upload (SIMPLIFIED)
      let finalProofUrl = data.proofUrl || "";
      let videoUrl = "";
      
      const file = (data as any).proofFile?.[0] as File | undefined;
      if (file) {
        console.log('📁 Uploading file...');
        
        // ULTRA SIMPLE PATH - no user folders, just public files
        const fileId = crypto.randomUUID();
        const bucket = file.type.startsWith("video/") ? "video-proofs" : "proofs";
        const path = `public/${fileId}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: false });
        
        if (uploadError) {
          console.error('❌ Upload failed:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
        
        if (file.type.startsWith("video/")) {
          videoUrl = publicData.publicUrl;
        } else {
          finalProofUrl = publicData.publicUrl;
        }
        
        console.log('✅ File uploaded');
      }

      // ULTRA SIMPLE DATABASE INSERT
      const submissionData = {
        leaderboard_id: leaderboard.id,
        user_id: user?.id || null,
        full_name: data.fullName,
        email: data.email,
        gender: data.gender,
        value_raw: raw,
        value_display: display,
        proof_url: finalProofUrl || null,
        video_url: videoUrl || null,
        status: 'APPROVED' as const,
        submission_metadata: {
          smart_parsing_used: leaderboard.smartTimeParsing,
          original_input: valueToUse
        }
      };
      
      console.log('💾 INSERTING:', submissionData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from("submissions")
        .insert(submissionData)
        .select();

      if (insertError) {
        console.error('❌ INSERT FAILED:', insertError);
        throw new Error(`Database error: ${insertError.message} (${insertError.code})`);
      }
      
      console.log('✅ SUCCESS!', insertResult);

      toast({ 
        title: "Success!", 
        description: "Submission added to leaderboard!" 
      });
      
      reset();
      setUploadProgress(0);
    } catch (error: any) {
      console.error('❌ SUBMISSION FAILED:', error);
      toast({ 
        title: "Failed", 
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getTimeInputPlaceholder = () => {
    if (leaderboard.smartTimeParsing) {
      return "e.g., 12:30, 1h 30m, 12mins 30sec";
    }
    return "mm:ss or hh:mm:ss";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit to {leaderboard.title}
        </CardTitle>
        <CardDescription>
          Submit your result to join the leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Honeypot */}
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register("website")} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name *</label>
              <Input 
                placeholder="Jane Athlete" 
                aria-invalid={!!errors.fullName} 
                {...register("fullName")} 
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input 
                placeholder="jane@example.com" 
                type="email" 
                aria-invalid={!!errors.email} 
                {...register("email")} 
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender *</label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
            
            <div className="md:col-span-2 space-y-2">
            <div className="grid gap-4">
              {leaderboard.metricType === 'time' ? (
                // Dropdown-based time entry
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Time Result *
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="hours" className="text-xs">Hours</Label>
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
                      <Label htmlFor="minutes" className="text-xs">Minutes</Label>
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
                      <Label htmlFor="seconds" className="text-xs">Seconds</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Select your time from the dropdown menus
                  </p>
                  {/* Hidden input to satisfy form validation */}
                  <input type="hidden" {...register("value")} value={`${timeInput.hours}:${timeInput.minutes}:${timeInput.seconds}`} />
                </div>
              ) : (
                // Regular text input for non-time metrics
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Result ({leaderboard.units || leaderboard.metricType}) *
                  </label>
                  <Input 
                    placeholder="Enter value" 
                    aria-invalid={!!errors.value} 
                    {...register("value")} 
                  />
                  {errors.value && (
                    <p className="text-sm text-destructive mt-1">{errors.value.message}</p>
                  )}
                </div>
               )}
               {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
            </div>
          </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proof URL (optional)</label>
              <Input 
                placeholder="Link to video, Strava, etc." 
                {...register("proofUrl")} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Or upload proof file (image/video)
              </label>
              <Input 
                type="file" 
                accept="image/*,video/*" 
                {...register("proofFile")} 
              />
              {!user && (
                <p className="text-xs text-muted-foreground">Login required to upload files</p>
              )}
              {watchedFile?.[0] && (
                <p className="text-xs text-muted-foreground">
                  Selected: {watchedFile[0].name} ({(watchedFile[0].size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          <Controller
            name="accept"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="accept" 
                  checked={!!value} 
                  onCheckedChange={(v) => onChange(Boolean(v))} 
                />
                <label htmlFor="accept" className="text-sm leading-relaxed">
                  I accept the rules and terms of this leaderboard. 
                  <a className="text-primary hover:underline ml-1" href="/terms" target="_blank">
                    Read full Terms & Conditions
                  </a>
                </label>
              </div>
            )}
          />
          {errors.accept && <p className="text-sm text-destructive">{errors.accept.message}</p>}

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading} 
              className="min-w-[120px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}