import { Card } from "@/components/ui/card";

export interface Stats {
  total: number;
  approved: number;
  bestDisplay: string | null;
  avgDisplay: string | null;
  lastUpdated: string | null;
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Approved", value: `${Math.round((stats.approved / Math.max(stats.total, 1)) * 100)}%` },
    { label: "Best", value: stats.bestDisplay ?? "—" },
    { label: "Average", value: stats.avgDisplay ?? "—" },
    { label: "Updated", value: stats.lastUpdated ?? "—" },
  ];

  return (
    <Card className="p-3 flex flex-wrap gap-2 items-center">
      {items.map((chip) => (
        <span key={chip.label} className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-sm">
          <span className="font-medium">{chip.label}:</span>
          <span>{chip.value}</span>
        </span>
      ))}
    </Card>
  );
}
