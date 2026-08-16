"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Training, TrainingType } from "@/lib/types";

const TRAINING_TYPES: TrainingType[] = [
  "general_staff",
  "admin",
  "medical",
  "finance",
  "other",
];

interface EditDraft {
  training_type: TrainingType;
  date: string;
  time: string;
}

function buildEditDraft(training: Training): EditDraft {
  return {
    training_type: training.training_type ?? "general_staff",
    date: training.date ?? "",
    time: training.time ?? "",
  };
}

export function TrainingsTable({
  conversionId,
  initialTrainings,
}: {
  conversionId: string;
  initialTrainings: Training[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [trainingType, setTrainingType] = useState<TrainingType>("general_staff");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddTraining(e: FormEvent) {
    e.preventDefault();

    setAddSubmitting(true);
    setAddError(null);

    const res = await fetch("/api/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversion_id: conversionId,
        training_type: trainingType,
        date: date || null,
        time: time || null,
      }),
    });

    setAddSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error ?? "Failed to add training");
      return;
    }

    setTrainingType("general_staff");
    setDate("");
    setTime("");
    setShowAddForm(false);
    router.refresh();
  }

  function handleStartEdit(training: Training) {
    setEditingId(training.id);
    setEditDraft(buildEditDraft(training));
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editDraft) return;

    setEditSubmitting(true);
    setEditError(null);

    const res = await fetch(`/api/trainings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        training_type: editDraft.training_type,
        date: editDraft.date || null,
        time: editDraft.time || null,
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

  async function handleDelete(training: Training) {
    if (!window.confirm("Delete this training session? This can't be undone.")) return;

    setDeletingId(training.id);
    setDeleteError(null);

    const res = await fetch(`/api/trainings/${training.id}`, { method: "DELETE" });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Failed to delete training");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Training type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Edit / Delete</th>
          </tr>
        </thead>
        <tbody>
          {initialTrainings.length === 0 && (
            <tr>
              <td colSpan={4}>No trainings scheduled yet.</td>
            </tr>
          )}
          {initialTrainings.map((training) => {
            const isEditing = editingId === training.id;
            return (
              <tr key={training.id}>
                {isEditing && editDraft ? (
                  <>
                    <td>
                      <select
                        value={editDraft.training_type}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            training_type: e.target.value as TrainingType,
                          })
                        }
                      >
                        {TRAINING_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editDraft.date}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, date: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={editDraft.time}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, time: e.target.value })
                        }
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <span className={`badge badge-${training.training_type}`}>
                        {training.training_type}
                      </span>
                    </td>
                    <td>{training.date ?? "—"}</td>
                    <td>{training.time ?? "—"}</td>
                  </>
                )}
                <td>
                  <div className="row-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(training.id)}
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
                        <button
                          type="button"
                          onClick={() => handleStartEdit(training)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(training)}
                          disabled={deletingId === training.id}
                        >
                          {deletingId === training.id ? "Deleting…" : "Delete"}
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
      {editError && <p className="error">{editError}</p>}
      {deleteError && <p className="error">{deleteError}</p>}

      {!showAddForm && (
        <button type="button" onClick={() => setShowAddForm(true)}>
          Add training
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddTraining} className="inline-form">
          <label>
            Training type
            <select
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value as TrainingType)}
            >
              {TRAINING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <button type="submit" disabled={addSubmitting}>
            {addSubmitting ? "Adding…" : "Save training"}
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
