import { useMemo } from "react";
import { ExternalLink, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface LeaderboardSubmission {
  id: string;
  fullName: string;
  valueRaw: number; // canonical for sort
  valueDisplay: string;
  proofUrl?: string | null;
  submittedAt: string; // ISO
  approvedAt?: string | null; // ISO
}

interface LeaderboardTableProps {
  title: string;
  unit?: string | null;
  submissions: LeaderboardSubmission[];
  sortDirection: SortDirection;
}

function rankSubmissions(
  submissions: LeaderboardSubmission[],
  sortDirection: SortDirection
) {
  const sorted = [...submissions].sort((a, b) => {
    if (a.valueRaw !== b.valueRaw) {
      return sortDirection === "asc"
        ? a.valueRaw - b.valueRaw
        : b.valueRaw - a.valueRaw;
    }
    const aApproved = a.approvedAt ? new Date(a.approvedAt).getTime() : Infinity;
    const bApproved = b.approvedAt ? new Date(b.approvedAt).getTime() : Infinity;
    if (aApproved !== bApproved) return aApproved - bApproved;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  let lastValue: number | null = null;
  let currentRank = 0;

  return sorted.map((s, idx) => {
    if (lastValue === null || s.valueRaw !== lastValue) {
      currentRank = idx + 1;
      lastValue = s.valueRaw;
    }
    return { ...s, rank: currentRank } as LeaderboardSubmission & { rank: number };
  });
}

function nameShort(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0)}.`;
}

export const LeaderboardTable = ({ title, unit, submissions, sortDirection }: LeaderboardTableProps) => {
  const ranked = useMemo(
    () => rankSubmissions(submissions, sortDirection),
    [submissions, sortDirection]
  );

  return (
    <section aria-labelledby={`${title}-heading`} className="animate-enter">
      <h2 id={`${title}-heading`} className="text-2xl font-bold tracking-tight mb-4">
        {title}
      </h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-card border-b">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Value{unit ? ` (${unit})` : ""}</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Proof</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold",
                          s.rank === 1 && "bg-[hsl(var(--prize-gold))]/20 text-foreground",
                          s.rank === 2 && "bg-[hsl(var(--prize-silver))]/20 text-foreground",
                          s.rank === 3 && "bg-[hsl(var(--prize-bronze))]/20 text-foreground",
                          s.rank > 3 && "bg-secondary text-secondary-foreground"
                        )}
                        aria-label={`Rank ${s.rank}`}
                      >
                        {s.rank <= 3 ? (
                          <Medal className="h-4 w-4" aria-hidden />
                        ) : (
                          s.rank
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{nameShort(s.fullName)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{s.valueDisplay}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.submittedAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
                  </td>
                  <td className="px-4 py-3">
                    {s.proofUrl ? (
                      <a
                        className="inline-flex items-center gap-1 story-link"
                        href={s.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open proof link"
                        title="Open proof link"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Proof</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {ranked.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No approved submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
