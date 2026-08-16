import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Conversion } from "@/lib/types";
import { NewConversionForm } from "./new-conversion-form";
import { GoLiveBadge } from "./go-live-badge";

export const dynamic = "force-dynamic";

function formatGoLiveDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function HomePage() {
  const { data: conversions, error } = await supabase
    .from("conversions")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Conversion[]>();

  return (
    <main className="page">
      <h1>Facility Conversions</h1>

      <section>
        <h2>New conversion</h2>
        <NewConversionForm />
      </section>

      <section>
        <h2>Existing conversions</h2>
        {error && <p className="error">Failed to load conversions: {error.message}</p>}
        {!error && (!conversions || conversions.length === 0) && (
          <p>No conversions yet.</p>
        )}
        {!error && conversions && conversions.length > 0 && (
          <div className="conversion-list">
            {conversions.map((c) => (
              <Link key={c.id} href={`/conversions/${c.id}`} className="conversion-card">
                <div className="conversion-card-main">
                  <span className="conversion-card-name">{c.facility_name}</span>
                  <span className="conversion-card-date">
                    Go-live {formatGoLiveDate(c.go_live_date)}
                  </span>
                </div>
                <div className="conversion-card-meta">
                  <GoLiveBadge conversion={c} />
                  <svg
                    className="conversion-card-chevron"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
