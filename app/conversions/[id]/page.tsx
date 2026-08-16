import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Conversion } from "@/lib/types";
import { ConversionDetailsForm } from "./conversion-details-form";
import { HealthScoreCard } from "./health-score-card";

export const dynamic = "force-dynamic";
// A slow Claude call (via the health score's post-go-live stalled-issue
// analysis) can otherwise get this cut off before it returns.
export const maxDuration = 60;

export default async function ConversionRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: conversion, error } = await supabase
    .from("conversions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !conversion) {
    notFound();
  }

  return (
    <>
      <h1>Conversion Record</h1>
      <HealthScoreCard conversionId={id} />
      <ConversionDetailsForm conversion={conversion as Conversion} />
    </>
  );
}
