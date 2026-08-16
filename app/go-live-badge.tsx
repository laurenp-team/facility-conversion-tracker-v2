import type { Conversion } from "@/lib/types";

export type BadgeColor = "green" | "amber" | "red";

export interface BadgeInfo {
  label: string;
  color: BadgeColor;
}

// PLACEHOLDER: currently shows go-live proximity (green = >3 weeks out,
// amber = within 3 weeks, red = go-live has passed). This will be replaced
// with a conversion health score (on track / at risk / critical) once that
// feature is built — only this function's internals need to change then;
// the card layout just calls <GoLiveBadge conversion={c} /> and never needs
// to know how the label/color are derived.
export function getGoLiveBadge(conversion: Conversion): BadgeInfo {
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const [y, m, d] = conversion.go_live_date.split("-").map(Number);
  const goLiveUTC = Date.UTC(y, m - 1, d);
  const days = Math.round((goLiveUTC - todayUTC) / 86_400_000);

  if (days < 0) {
    const abs = Math.abs(days);
    return { label: `${abs} day${abs === 1 ? "" : "s"} ago`, color: "red" };
  }
  if (days === 0) {
    return { label: "Today", color: "amber" };
  }
  if (days <= 21) {
    return { label: `${days} day${days === 1 ? "" : "s"} out`, color: "amber" };
  }
  return { label: `${days} days out`, color: "green" };
}

export function GoLiveBadge({ conversion }: { conversion: Conversion }) {
  const { label, color } = getGoLiveBadge(conversion);
  return <span className={`status-badge status-badge-${color}`}>{label}</span>;
}
