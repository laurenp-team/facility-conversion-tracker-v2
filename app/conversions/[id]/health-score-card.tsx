import { getHealthScore, HEALTH_FLAG_LABEL, HEALTH_FLAG_COLOR } from "@/lib/healthScore";

export async function HealthScoreCard({ conversionId }: { conversionId: string }) {
  const { flag, reasons } = await getHealthScore(conversionId);
  const color = HEALTH_FLAG_COLOR[flag];

  return (
    <div className="card health-score-card">
      <div className="health-score-header">
        <h2>Health score</h2>
        <span className={`status-badge status-badge-${color}`}>
          {HEALTH_FLAG_LABEL[flag]}
        </span>
      </div>
      {reasons.length > 0 ? (
        <ul className="health-score-reasons">
          {reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="hint">No risk factors identified.</p>
      )}
    </div>
  );
}
