import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type MetricType = "time" | "reps" | "distance" | "weight";

export interface ChallengeMeta {
  id: string;
  metricType: MetricType;
  unit?: string | null;
}

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Please enter your full name")
      .refine((v) => !/(fuck|shit|cunt|bitch)/i.test(v), "Inappropriate words are not allowed"),
    email: z.string().email("Enter a valid email"),
    gender: z.enum(["male", "female", "other"]),
    value: z.string().min(1, "Please enter your result"),
    proofUrl: z.string().url().optional().or(z.literal("")),
    proofFile: z.any().optional(),
    accept: z.boolean().refine((v) => v === true, "You must accept the rules & terms"),
    website: z.string().optional(), // honeypot
  })
  .refine((data) => !data.website, { message: "Invalid", path: ["website"] });

function parseToRaw(metric: MetricType, v: string): { raw: number; display: string } {
  const value = v.trim();
  if (metric === "time") {
    // supports h:mm:ss or mm:ss
    const parts = value.split(":").map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n))) throw new Error("Invalid time");
    let h = 0, m = 0, s = 0;
    if (parts.length === 2) [m, s] = parts as [number, number];
    else if (parts.length === 3) [h, m, s] = parts as [number, number, number];
    else throw new Error("Use mm:ss or hh:mm:ss");
    const ms = ((h * 60 + m) * 60 + s) * 1000;
    const disp = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
    return { raw: ms, display: disp };
  }
  if (metric === "reps") {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive integer");
    return { raw: n, display: String(n) };
  }
  if (metric === "distance") {
    // allow suffix km
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

export function SubmissionForm({ challenge }: { challenge: ChallengeMeta }) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { gender: "male" } });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const { raw, display } = parseToRaw(challenge.metricType, data.value);

      let finalProofUrl = data.proofUrl || "";
      const file = (data as any).proofFile as File | undefined;
      if (file) {
        // Use anonymous folder structure for file uploads
        const path = `anonymous/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("proofs").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);
        finalProofUrl = pub.publicUrl;
      }

      // Save to submissions table (assuming challenge.id maps to leaderboard_id)
      const submissionData = {
        leaderboard_id: challenge.id,
        user_id: null, // Anonymous submission
        full_name: data.fullName,
        email: data.email,
        gender: data.gender,
        value_raw: raw,
        value_display: display,
        proof_url: finalProofUrl || null,
        status: 'PENDING' as const,
        submission_metadata: {
          source: 'basic_form',
          original_input: data.value
        }
      };

      const { data: insertResult, error: insertError } = await supabase
        .from("submissions")
        .insert(submissionData)
        .select();

      if (insertError) {
        console.error('Submission insert failed:', insertError);
        throw new Error(`Failed to save submission: ${insertError.message}`);
      }

      console.log("✅ Submission saved:", insertResult);
      toast({ 
        title: "Submitted!", 
        description: "Your submission has been saved and is pending approval." 
      });
      reset();
    } catch (e: any) {
      console.error('Submission error:', e);
      toast({ 
        title: "Submission failed", 
        description: e?.message ?? "Please check your input and try again",
        variant: "destructive"
      });
    }
  };

  return (
    <section aria-labelledby="submit-heading" className="animate-enter">
      <h2 id="submit-heading" className="text-2xl font-bold tracking-tight mb-4">Submit your result</h2>
      <Card className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Honeypot */}
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register("website")} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <Input placeholder="Jane Athlete" aria-invalid={!!errors.fullName} {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="jane@example.com" type="email" aria-invalid={!!errors.email} {...register("email")} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Gender</label>
              <Select onValueChange={(v) => (document.getElementById("genderHidden") as HTMLInputElement).value = v}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <input id="genderHidden" type="hidden" {...register("gender")} defaultValue="male" />
              {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Result ({challenge.unit ?? challenge.metricType})</label>
              <Input placeholder={challenge.metricType === "time" ? "mm:ss or hh:mm:ss" : "Enter value"} aria-invalid={!!errors.value} {...register("value")} />
              {errors.value && <p className="text-sm text-destructive mt-1">{errors.value.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Proof URL (optional)</label>
              <Input placeholder="Link to video/Strava" aria-invalid={false} {...register("proofUrl")} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Or upload proof file</label>
              <Input type="file" accept="image/*,video/*" {...register("proofFile")} />
              <p className="text-xs text-muted-foreground mt-1">Login required to upload. Files are stored securely.</p>
            </div>
          </div>

          <Controller
            name="accept"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-start gap-2">
                <Checkbox id="accept" checked={!!value} onCheckedChange={(v) => onChange(Boolean(v))} />
                <label htmlFor="accept" className="text-sm leading-none">
                  I accept the Rules & Terms. <a className="story-link" href="/terms">Read full T&Cs</a>
                </label>
              </div>
            )}
          />
          {errors.accept && <p className="text-sm text-destructive mt-1">{errors.accept.message}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="hover-scale">Submit</Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
