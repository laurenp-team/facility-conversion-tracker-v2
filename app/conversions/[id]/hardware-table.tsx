"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { HardwareItem, HardwareStatus } from "@/lib/types";

const STATUSES: HardwareStatus[] = ["not_ordered", "ordered", "shipped", "delivered"];

interface EditDraft {
  item_name: string;
  expected_delivery_date: string; // "" means null
}

function buildEditDraft(item: HardwareItem): EditDraft {
  return {
    item_name: item.item_name,
    expected_delivery_date: item.expected_delivery_date ?? "",
  };
}

export function HardwareTable({
  conversionId,
  initialHardware,
}: {
  conversionId: string;
  initialHardware: HardwareItem[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemName, setItemName] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [statusDrafts, setStatusDrafts] = useState<Record<string, HardwareStatus>>(
    () => Object.fromEntries(initialHardware.map((h) => [h.id, h.status]))
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddHardware(e: FormEvent) {
    e.preventDefault();

    if (!itemName.trim()) {
      setAddError("Enter an item name");
      return;
    }

    setAddSubmitting(true);
    setAddError(null);

    const res = await fetch("/api/hardware", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversion_id: conversionId,
        item_name: itemName,
        ...(expectedDeliveryDate ? { expected_delivery_date: expectedDeliveryDate } : {}),
      }),
    });

    setAddSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error ?? "Failed to add hardware item");
      return;
    }

    setItemName("");
    setExpectedDeliveryDate("");
    setShowAddForm(false);
    router.refresh();
  }

  async function handleUpdateStatus(itemId: string) {
    setUpdatingId(itemId);
    setUpdateError(null);

    const res = await fetch(`/api/hardware/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusDrafts[itemId] }),
    });

    setUpdatingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setUpdateError(body.error ?? "Failed to update status");
      return;
    }

    router.refresh();
  }

  function handleStartEdit(item: HardwareItem) {
    setEditingId(item.id);
    setEditDraft(buildEditDraft(item));
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setEditError(null);
  }

  async function handleSaveEdit(itemId: string) {
    if (!editDraft) return;

    if (!editDraft.item_name.trim()) {
      setEditError("Enter an item name");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    const res = await fetch(`/api/hardware/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: editDraft.item_name,
        expected_delivery_date: editDraft.expected_delivery_date || null,
      }),
    });

    setEditSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.error ?? "Failed to save changes");
      return;
    }

    setEditingId(null);
    setEditDraft(null);
    router.refresh();
  }

  async function handleDelete(item: HardwareItem) {
    if (!window.confirm(`Delete "${item.item_name}"? This can't be undone.`)) return;

    setDeletingId(item.id);
    setDeleteError(null);

    const res = await fetch(`/api/hardware/${item.id}`, { method: "DELETE" });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Failed to delete hardware item");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Item name</th>
            <th>Status</th>
            <th>Expected delivery date</th>
            <th>Update status</th>
            <th>Edit / Delete</th>
          </tr>
        </thead>
        <tbody>
          {initialHardware.length === 0 && (
            <tr>
              <td colSpan={5}>No hardware items yet.</td>
            </tr>
          )}
          {initialHardware.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id}>
                {isEditing && editDraft ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editDraft.item_name}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, item_name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editDraft.expected_delivery_date}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            expected_delivery_date: e.target.value,
                          })
                        }
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.item_name}</td>
                    <td>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.expected_delivery_date ?? "—"}</td>
                  </>
                )}
                <td>
                  <div className="row-actions">
                    <select
                      value={statusDrafts[item.id]}
                      onChange={(e) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value as HardwareStatus,
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
                      onClick={() => handleUpdateStatus(item.id)}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? "Updating…" : "Update status"}
                    </button>
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
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
                        <button type="button" onClick={() => handleStartEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? "Deleting…" : "Delete"}
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
          Add hardware item
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddHardware} className="inline-form">
          <label>
            Item name
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </label>
          <label>
            Expected delivery date (optional)
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </label>
          <button type="submit" disabled={addSubmitting}>
            {addSubmitting ? "Adding…" : "Save hardware item"}
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
