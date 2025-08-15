import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Video } from "lucide-react";
import { useState } from "react";

type MetricType = "time" | "reps" | "distance" | "weight";

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
    videoFile: z.instanceof(File).optional(),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ 
    resolver: zodResolver(schema), 
    defaultValues: { 
      gender: "male"
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be under 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setValue('videoFile', file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      console.log('🚀 SUBMISSION WITH VIDEO:', { leaderboard: leaderboard.id, hasVideo: !!selectedFile });
      
      // Parse the value using smart parsing
      const { raw, display } = parseToRawSmart(leaderboard.metricType, data.value, leaderboard.smartTimeParsing);
      console.log('✅ Value parsed:', { raw, display });

      let videoUrl = null;

      // Upload video if provided
      if (selectedFile) {
        console.log('📹 Uploading video...');
        setUploadProgress(0);
        
        // Create unique file path
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `submissions/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('video-proofs')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ VIDEO UPLOAD FAILED:', uploadError);
          throw new Error(`Video upload failed: ${uploadError.message}`);
        }

        console.log('✅ Video uploaded:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('video-proofs')
          .getPublicUrl(filePath);
        
        videoUrl = publicUrl;
        setUploadProgress(100);
      }

      // Database insert with video URL
      const submissionData = {
        leaderboard_id: leaderboard.id,
        user_id: null, // Anonymous submission for now
        full_name: data.fullName,
        email: data.email,
        gender: data.gender,
        value_raw: raw,
        value_display: display,
        proof_url: data.proofUrl || null,
        video_url: videoUrl,
        status: 'APPROVED' as const,
        submission_metadata: {
          smart_parsing_used: leaderboard.smartTimeParsing,
          original_input: data.value,
          has_video: !!videoUrl
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
        description: `Submission added to leaderboard!${videoUrl ? ' Video uploaded successfully.' : ''}` 
      });
      
      // Reset form and states
      reset();
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      setUploadProgress(0);
      
    } catch (error: any) {
      console.error('❌ SUBMISSION FAILED:', error);
      toast({ 
        title: "Failed", 
        description: error.message || "Unknown error",
        variant: "destructive"
      });
      setUploadProgress(0);
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
              <label className="text-sm font-medium">
                Result ({leaderboard.units || leaderboard.metricType}) *
              </label>
              <Input 
                placeholder={leaderboard.metricType === 'time' ? getTimeInputPlaceholder() : "Enter value"} 
                aria-invalid={!!errors.value} 
                {...register("value")} 
              />
              {errors.value && (
                <p className="text-sm text-destructive mt-1">{errors.value.message}</p>
              )}
              {leaderboard.metricType === 'time' && leaderboard.smartTimeParsing && (
                <p className="text-xs text-muted-foreground">
                  You can enter time in various formats: 12:30, 1h 30m, 12mins 30sec, etc.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Proof URL (optional)</label>
            <Input 
              placeholder="Link to video, Strava, etc." 
              {...register("proofUrl")} 
            />
            <p className="text-xs text-muted-foreground">
              Add a link to verify your result (YouTube, Strava, etc.)
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Proof (optional)
              </label>
              <Input 
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload a video to support your submission (max 50MB)
              </p>
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Selected: {selectedFile.name}</span>
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {videoPreviewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <video 
                  src={videoPreviewUrl} 
                  controls 
                  className="w-full max-w-md rounded-lg border"
                  style={{ maxHeight: '200px' }}
                />
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
            disabled={isSubmitting} 
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