"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { IssueComment } from "@/lib/types";

export function IssueComments({
  issueId,
  comments,
}: {
  issueId: string;
  comments: IssueComment[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/issues/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add comment");
      return;
    }

    setText("");
    router.refresh();
  }

  return (
    <div className="comments">
      {comments.length === 0 ? (
        <p className="hint">No comments yet.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <span className="comment-date">
                {new Date(c.created_at).toLocaleString()}
              </span>
              <span className="comment-text">{c.comment}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="e.g. part ordered, submitted to development, technician scheduled…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={submitting || !text.trim()}>
          {submitting ? "Adding…" : "Add comment"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
