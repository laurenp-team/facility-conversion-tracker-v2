import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Conversion } from "@/lib/types";
import { NewConversionForm } from "./new-conversion-form";

export const dynamic = "force-dynamic";

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
          <ul className="record-list">
            {conversions.map((c) => (
              <li key={c.id}>
                <Link href={`/conversions/${c.id}`}>
                  <strong>{c.facility_name}</strong> — go-live {c.go_live_date}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
