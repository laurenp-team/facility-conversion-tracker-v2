"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { OnsiteTeamMember } from "@/lib/types";

export function OnsiteTeamList({
  conversionId,
  initialTeam,
}: {
  conversionId: string;
  initialTeam: OnsiteTeamMember[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddStaff(e: FormEvent) {
    e.preventDefault();

    if (!staffName.trim()) {
      setAddError("Enter a staff name");
      return;
    }

    setAddSubmitting(true);
    setAddError(null);

    const res = await fetch("/api/onsite-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversion_id: conversionId, staff_name: staffName }),
    });

    setAddSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error ?? "Failed to add staff member");
      return;
    }

    setStaffName("");
    setShowAddForm(false);
    router.refresh();
  }

  async function handleDelete(member: OnsiteTeamMember) {
    if (!window.confirm(`Remove "${member.staff_name}"? This can't be undone.`))
      return;

    setDeletingId(member.id);
    setDeleteError(null);

    const res = await fetch(`/api/onsite-team/${member.id}`, { method: "DELETE" });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Failed to remove staff member");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Staff name</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {initialTeam.length === 0 && (
            <tr>
              <td colSpan={2}>No team members added yet.</td>
            </tr>
          )}
          {initialTeam.map((member) => (
            <tr key={member.id}>
              <td>{member.staff_name}</td>
              <td>
                <button
                  type="button"
                  onClick={() => handleDelete(member)}
                  disabled={deletingId === member.id}
                >
                  {deletingId === member.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deleteError && <p className="error">{deleteError}</p>}

      {!showAddForm && (
        <button type="button" onClick={() => setShowAddForm(true)}>
          Add staff
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddStaff} className="inline-form">
          <label>
            Staff name
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={addSubmitting}>
            {addSubmitting ? "Adding…" : "Save staff"}
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
