import { getHealthScore, HEALTH_FLAG_LABEL, HEALTH_FLAG_COLOR } from "@/lib/healthScore";

// Async Server Component - same call-site shape as the old GoLiveBadge
// (<HealthScoreBadge conversionId={c.id} />), so the card layout on the
// homepage didn't need to change, only the data source powering it.
export async function HealthScoreBadge({ conversionId }: { conversionId: string }) {
  const { flag } = await getHealthScore(conversionId);
  const color = HEALTH_FLAG_COLOR[flag];
  return <span className={`status-badge status-badge-${color}`}>{HEALTH_FLAG_LABEL[flag]}</span>;
}
