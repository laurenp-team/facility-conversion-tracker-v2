import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Conversion, SettingRow } from "@/lib/types";
import { SETTING_NAMES } from "@/lib/types";
import { SettingsTable } from "../settings-table";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [conversionResult, settingsResult] = await Promise.all([
    supabase.from("conversions").select("*").eq("id", id).single(),
    supabase.from("settings").select("*").eq("conversion_id", id),
  ]);

  const conversion = conversionResult.data as Conversion | null;
  const settings = settingsResult.data as SettingRow[] | null;

  if (conversionResult.error || !conversion) {
    notFound();
  }

  // Preserve the fixed checklist order (not alphabetical, no reliable
  // insertion-order guarantee from Postgres without an explicit sort key).
  const orderedSettings = [...(settings ?? [])].sort(
    (a, b) =>
      SETTING_NAMES.indexOf(a.setting_name as (typeof SETTING_NAMES)[number]) -
      SETTING_NAMES.indexOf(b.setting_name as (typeof SETTING_NAMES)[number])
  );

  return (
    <main className="page">
      <p>
        <Link href={`/conversions/${id}`}>&larr; Conversion Record</Link>
      </p>
      <h1>Settings — {conversion.facility_name}</h1>

      {settingsResult.error && (
        <p className="error">
          Failed to load settings: {settingsResult.error.message}
        </p>
      )}
      <SettingsTable initialSettings={orderedSettings} />
    </main>
  );
}
