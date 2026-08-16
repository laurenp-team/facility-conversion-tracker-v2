"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SettingRow, SettingStatus } from "@/lib/types";

const STATUSES: SettingStatus[] = [
  "completed",
  "not_completed",
  "awaiting_information",
  "not_applicable",
];

export function SettingsTable({ initialSettings }: { initialSettings: SettingRow[] }) {
  const router = useRouter();

  const [statusDrafts, setStatusDrafts] = useState<Record<string, SettingStatus>>(
    () => Object.fromEntries(initialSettings.map((s) => [s.id, s.status]))
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function handleUpdateStatus(settingId: string) {
    setUpdatingId(settingId);
    setUpdateError(null);

    const res = await fetch(`/api/settings/${settingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusDrafts[settingId] }),
    });

    setUpdatingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setUpdateError(body.error ?? "Failed to update status");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Status</th>
            <th>Update status</th>
          </tr>
        </thead>
        <tbody>
          {initialSettings.length === 0 && (
            <tr>
              <td colSpan={3}>No settings found.</td>
            </tr>
          )}
          {initialSettings.map((setting) => (
            <tr key={setting.id}>
              <td>{setting.setting_name}</td>
              <td>
                <span className={`badge badge-${setting.status}`}>{setting.status}</span>
              </td>
              <td>
                <div className="row-actions">
                  <select
                    value={statusDrafts[setting.id]}
                    onChange={(e) =>
                      setStatusDrafts((prev) => ({
                        ...prev,
                        [setting.id]: e.target.value as SettingStatus,
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
                    onClick={() => handleUpdateStatus(setting.id)}
                    disabled={updatingId === setting.id}
                  >
                    {updatingId === setting.id ? "Updating…" : "Update status"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {updateError && <p className="error">{updateError}</p>}
    </div>
  );
}
