"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { OnsiteRequirement, OnsiteRequirementStatus } from "@/lib/types";

const STATUSES: OnsiteRequirementStatus[] = ["needed", "provided"];

export function OnsiteRequirementsTable({
  conversionId,
  initialRequirements,
}: {
  conversionId: string;
  initialRequirements: OnsiteRequirement[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [requirementName, setRequirementName] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [statusDrafts, setStatusDrafts] = useState<
    Record<string, OnsiteRequirementStatus>
  >(() => Object.fromEntries(initialRequirements.map((r) => [r.id, r.status])));
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddRequirement(e: FormEvent) {
    e.preventDefault();

    if (!requirementName.trim()) {
      setAddError("Enter a requirement name");
      return;
    }

    setAddSubmitting(true);
    setAddError(null);

    const res = await fetch("/api/onsite-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversion_id: conversionId,
        requirement_name: requirementName,
      }),
    });

    setAddSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error ?? "Failed to add requirement");
      return;
    }

    setRequirementName("");
    setShowAddForm(false);
    router.refresh();
  }

  async function handleUpdateStatus(id: string) {
    setUpdatingId(id);
    setUpdateError(null);

    const res = await fetch(`/api/onsite-requirements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusDrafts[id] }),
    });

    setUpdatingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setUpdateError(body.error ?? "Failed to update status");
      return;
    }

    router.refresh();
  }

  function handleStartEdit(req: OnsiteRequirement) {
    setEditingId(req.id);
    setEditDraft(req.requirement_name);
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditDraft("");
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editDraft.trim()) {
      setEditError("Enter a requirement name");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    const res = await fetch(`/api/onsite-requirements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement_name: editDraft }),
    });

    setEditSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.error ?? "Failed to save changes");
      return;
    }

    setEditingId(null);
    setEditDraft("");
    router.refresh();
  }

  async function handleDelete(req: OnsiteRequirement) {
    if (!window.confirm(`Delete "${req.requirement_name}"? This can't be undone.`))
      return;

    setDeletingId(req.id);
    setDeleteError(null);

    const res = await fetch(`/api/onsite-requirements/${req.id}`, { method: "DELETE" });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Failed to delete requirement");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Status</th>
            <th>Update status</th>
            <th>Edit / Delete</th>
          </tr>
        </thead>
        <tbody>
          {initialRequirements.length === 0 && (
            <tr>
              <td colSpan={4}>No requirements yet.</td>
            </tr>
          )}
          {initialRequirements.map((req) => {
            const isEditing = editingId === req.id;
            return (
              <tr key={req.id}>
                {isEditing ? (
                  <td>
                    <input
                      type="text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                    />
                  </td>
                ) : (
                  <td>{req.requirement_name}</td>
                )}
                <td>
                  <span className={`badge badge-${req.status}`}>{req.status}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <select
                      value={statusDrafts[req.id]}
                      onChange={(e) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [req.id]: e.target.value as OnsiteRequirementStatus,
                        }))
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id)}
                      disabled={updatingId === req.id}
                    >
                      {updatingId === req.id ? "Updating…" : "Update status"}
                    </button>
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(req.id)}
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
                        <button type="button" onClick={() => handleStartEdit(req)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(req)}
                          disabled={deletingId === req.id}
                        >
                          {deletingId === req.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {updateError && <p className="error">{updateError}</p>}
      {editError && <p className="error">{editError}</p>}
      {deleteError && <p className="error">{deleteError}</p>}

      {!showAddForm && (
        <button type="button" onClick={() => setShowAddForm(true)}>
          Add requirement
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddRequirement} className="inline-form">
          <label>
            Requirement name
            <input
              type="text"
              value={requirementName}
              onChange={(e) => setRequirementName(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={addSubmitting}>
            {addSubmitting ? "Adding…" : "Save requirement"}
          </button>
          <button type="button" onClick={() => setShowAddForm(false)}>
            Cancel
          </button>
          {addError && <p className="error">{addError}</p>}
        </form>
      )}
    </div>
  );
}
