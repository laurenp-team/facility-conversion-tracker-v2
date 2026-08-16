import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Conversion } from "@/lib/types";
import { ConversionDetailsForm } from "./conversion-details-form";

export const dynamic = "force-dynamic";

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
      <ConversionDetailsForm conversion={conversion as Conversion} />
    </>
  );
}
