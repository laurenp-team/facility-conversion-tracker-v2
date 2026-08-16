import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Conversion, HardwareItem } from "@/lib/types";
import { HardwareTable } from "../hardware-table";

export const dynamic = "force-dynamic";

export default async function HardwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [conversionResult, hardwareResult] = await Promise.all([
    supabase.from("conversions").select("*").eq("id", id).single(),
    supabase.from("hardware").select("*").eq("conversion_id", id).order("item_name"),
  ]);

  const conversion = conversionResult.data as Conversion | null;
  const hardware = hardwareResult.data as HardwareItem[] | null;

  if (conversionResult.error || !conversion) {
    notFound();
  }

  return (
    <main className="page">
      <p>
        <Link href={`/conversions/${id}`}>&larr; Conversion Record</Link>
      </p>
      <h1>Hardware — {conversion.facility_name}</h1>

      {hardwareResult.error && (
        <p className="error">
          Failed to load hardware: {hardwareResult.error.message}
        </p>
      )}
      <HardwareTable conversionId={id} initialHardware={hardware ?? []} />
    </main>
  );
}
