"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Conversion } from "@/lib/types";

function describeGoLiveOffset(goLiveDate: string): string {
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = goLiveDate.split("-").map(Number);
  const goLiveUTC = Date.UTC(y, m - 1, d);
  const days = Math.round((goLiveUTC - todayUTC) / 86_400_000);

  if (days === 0) return "Go-live is today";
  if (days > 0) return `Go-live in ${days} day${days === 1 ? "" : "s"}`;
  return `Go-live was ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}

interface ContactFields {
  name: string;
  email: string;
  phone: string;
}

const CONTACT_ROLES: { key: "main" | "finance" | "it"; label: string }[] = [
  { key: "main", label: "Main Contact" },
  { key: "finance", label: "Finance Contact" },
  { key: "it", label: "IT Contact" },
];

function contactFieldsFromConversion(
  conversion: Conversion,
  role: "main" | "finance" | "it"
): ContactFields {
  switch (role) {
    case "main":
      return {
        name: conversion.main_contact_name ?? "",
        email: conversion.main_contact_email ?? "",
        phone: conversion.main_contact_phone ?? "",
      };
    case "finance":
      return {
        name: conversion.finance_contact_name ?? "",
        email: conversion.finance_contact_email ?? "",
        phone: conversion.finance_contact_phone ?? "",
      };
    case "it":
      return {
        name: conversion.it_contact_name ?? "",
        email: conversion.it_contact_email ?? "",
        phone: conversion.it_contact_phone ?? "",
      };
  }
}

export function ConversionDetailsForm({ conversion }: { conversion: Conversion }) {
  const router = useRouter();
  const [facilityName, setFacilityName] = useState(conversion.facility_name);
  const [goLiveDate, setGoLiveDate] = useState(conversion.go_live_date);
  const [contacts, setContacts] = useState<Record<string, ContactFields>>(() =>
    Object.fromEntries(
      CONTACT_ROLES.map(({ key }) => [key, contactFieldsFromConversion(conversion, key)])
    )
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateContact(
    role: "main" | "finance" | "it",
    field: keyof ContactFields,
    value: string
  ) {
    setContacts((prev) => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const contactPayload: Record<string, string> = {};
    for (const { key } of CONTACT_ROLES) {
      contactPayload[`${key}_contact_name`] = contacts[key].name;
      contactPayload[`${key}_contact_email`] = contacts[key].email;
      contactPayload[`${key}_contact_phone`] = contacts[key].phone;
    }

    const res = await fetch(`/api/conversions/${conversion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_name: facilityName,
        go_live_date: goLiveDate,
        ...contactPayload,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="inline-form field-row">
        <label>
          Facility name
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
          />
        </label>
        <label>
          Go-live date
          <input
            type="date"
            value={goLiveDate}
            onChange={(e) => setGoLiveDate(e.target.value)}
          />
          {goLiveDate && (
            <span className="hint">{describeGoLiveOffset(goLiveDate)}</span>
          )}
        </label>
      </div>

      <h2>Contacts</h2>
      <div className="contacts-grid">
        {CONTACT_ROLES.map(({ key, label }) => (
          <div className="contact-card" key={key}>
            <h3>{label}</h3>
            <label>
              Name
              <input
                type="text"
                value={contacts[key].name}
                onChange={(e) => updateContact(key, "name", e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={contacts[key].email}
                onChange={(e) => updateContact(key, "email", e.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={contacts[key].phone}
                onChange={(e) => updateContact(key, "phone", e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="inline-form">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="confirmation">Saved.</span>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
