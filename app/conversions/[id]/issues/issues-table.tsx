"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, IssueComment } from "@/lib/types";
import { IssueComments } from "./issue-comments";

export function IssuesTable({
  issues,
  commentsByIssueId,
  emptyMessage = "No issues logged yet.",
}: {
  issues: Issue[];
  commentsByIssueId: Record<string, IssueComment[]>;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleMarkResolved(issueId: string) {
    setResolvingId(issueId);
    setError(null);

    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });

    setResolvingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to mark resolved");
      return;
    }

    router.refresh();
  }

  function handleStartEdit(issue: Issue) {
    setEditingId(issue.id);
    setEditDraft(issue.description);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function handleSaveEdit(issueId: string) {
    if (!editDraft.trim()) {
      setError("Description cannot be empty");
      return;
    }

    setEditSubmitting(true);
    setError(null);

    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: editDraft }),
    });

    setEditSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save changes");
      return;
    }

    setEditingId(null);
    setEditDraft("");
    router.refresh();
  }

  async function handleDelete(issue: Issue) {
    if (
      !window.confirm(
        "Delete this issue and all its comments? This can't be undone."
      )
    )
      return;

    setDeletingId(issue.id);
    setError(null);

    const res = await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete issue");
      return;
    }

    router.refresh();
  }

  if (issues.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <div className="issue-list">
      {error && <p className="error">{error}</p>}
      {issues.map((issue) => {
        const isEditing = editingId === issue.id;
        return (
          <div
            key={issue.id}
            className={`issue-card${issue.resolved ? " resolved" : ""}`}
          >
            {isEditing ? (
              <textarea
                className="issue-edit-textarea"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="issue-description">{issue.description}</p>
            )}
            <div className="issue-meta">
              <span
                className={`badge badge-${issue.classification ?? "pending"}`}
              >
                {issue.classification ?? "pending"}
              </span>
              <span>Logged: {new Date(issue.date_logged).toLocaleString()}</span>
              <span>Resolved: {issue.resolved ? "Yes" : "No"}</span>
              <span>
                Resolved on:{" "}
                {issue.date_resolved
                  ? new Date(issue.date_resolved).toLocaleString()
                  : "—"}
              </span>
              {!issue.resolved && !isEditing && (
                <button
                  type="button"
                  onClick={() => handleMarkResolved(issue.id)}
                  disabled={resolvingId === issue.id}
                >
                  {resolvingId === issue.id ? "Saving…" : "Mark resolved"}
                </button>
              )}
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(issue.id)}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => handleStartEdit(issue)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(issue)}
                    disabled={deletingId === issue.id}
                  >
                    {deletingId === issue.id ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </div>

            <h3>Comments</h3>
            <IssueComments
              issueId={issue.id}
              comments={commentsByIssueId[issue.id] ?? []}
            />
          </div>
        );
      })}
    </div>
  );
}
