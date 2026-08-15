"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function IssueForm({ conversionId }: { conversionId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/issues/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversion_id: conversionId, description }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to submit issue");
      return;
    }

    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <label>
        Issue description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting for triage…" : "Submit for triage"}
      </button>
      {submitting && (
        <p className="hint">Claude is classifying this issue — this can take a few seconds.</p>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
