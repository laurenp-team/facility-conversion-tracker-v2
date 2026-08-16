import Link from "next/link";
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
    <main className="page">
      <p>
        <Link href="/">&larr; All conversions</Link>
      </p>
      <h1>Conversion Record</h1>

      <ConversionDetailsForm conversion={conversion as Conversion} />

      <div className="section-nav">
        <Link className="nav-button" href={`/conversions/${id}/documents`}>
          Go to Documents &rarr;
        </Link>
        <Link className="nav-button" href={`/conversions/${id}/issues`}>
          Go to Issue Log &rarr;
        </Link>
        <Link className="nav-button" href={`/conversions/${id}/hardware`}>
          Go to Hardware &rarr;
        </Link>
        <Link className="nav-button" href={`/conversions/${id}/settings`}>
          Go to Settings &rarr;
        </Link>
      </div>
    </main>
  );
}
