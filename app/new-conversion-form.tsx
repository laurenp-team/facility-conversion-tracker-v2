"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function NewConversionForm() {
  const router = useRouter();
  const [facilityName, setFacilityName] = useState("");
  const [goLiveDate, setGoLiveDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_name: facilityName,
        go_live_date: goLiveDate,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create conversion");
      return;
    }

    const conversion = await res.json();
    router.push(`/conversions/${conversion.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <label>
        Facility name
        <input
          type="text"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          required
        />
      </label>
      <label>
        Go-live date
        <input
          type="date"
          value={goLiveDate}
          onChange={(e) => setGoLiveDate(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create conversion"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
