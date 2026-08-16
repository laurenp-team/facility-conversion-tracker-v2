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

// "Facility details" provider cards — same shape/visual style as the
// Main/Finance/IT contact cards above, but the underlying columns don't
// follow one uniform ${role}_contact_* pattern, so each role's field names
// are spelled out explicitly here rather than derived.
interface ProviderFields {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

type ProviderKey = "trust" | "jms" | "phone_provider";

// jms/phone_provider field names feed an upcoming health-score feature
// (high-urgency risk category, critical if unknown within 4 weeks of
// go-live) - keep these column names stable. trust_* is reference-only.
const PROVIDER_CONFIGS: {
  key: ProviderKey;
  label: string;
  nameLabel: string;
  nameField: keyof Conversion;
  contactNameField: keyof Conversion;
  contactEmailField: keyof Conversion;
  contactPhoneField: keyof Conversion;
}[] = [
  {
    key: "trust",
    label: "Trust Accounting Software",
    nameLabel: "Software name",
    nameField: "trust_software_name",
    contactNameField: "trust_contact_name",
    contactEmailField: "trust_contact_email",
    contactPhoneField: "trust_contact_phone",
  },
  {
    key: "jms",
    label: "JMS",
    nameLabel: "Provider name",
    nameField: "jms_name",
    contactNameField: "jms_contact_name",
    contactEmailField: "jms_contact_email",
    contactPhoneField: "jms_contact_phone",
  },
  {
    key: "phone_provider",
    label: "Phone Provider",
    nameLabel: "Provider name",
    nameField: "phone_provider_name",
    contactNameField: "phone_provider_contact_name",
    contactEmailField: "phone_provider_contact_email",
    contactPhoneField: "phone_provider_contact_phone",
  },
];

function providerFieldsFromConversion(
  conversion: Conversion,
  config: (typeof PROVIDER_CONFIGS)[number]
): ProviderFields {
  return {
    name: (conversion[config.nameField] as string | null) ?? "",
    contactName: (conversion[config.contactNameField] as string | null) ?? "",
    contactEmail: (conversion[config.contactEmailField] as string | null) ?? "",
    contactPhone: (conversion[config.contactPhoneField] as string | null) ?? "",
  };
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
  const [adp, setAdp] = useState(conversion.adp !== null ? String(conversion.adp) : "");
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderFields>>(() =>
    Object.fromEntries(
      PROVIDER_CONFIGS.map((config) => [
        config.key,
        providerFieldsFromConversion(conversion, config),
      ])
    ) as Record<ProviderKey, ProviderFields>
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

  function updateProvider(role: ProviderKey, field: keyof ProviderFields, value: string) {
    setProviders((prev) => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
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

    const providerPayload: Record<string, string> = {};
    for (const config of PROVIDER_CONFIGS) {
      providerPayload[config.nameField] = providers[config.key].name;
      providerPayload[config.contactNameField] = providers[config.key].contactName;
      providerPayload[config.contactEmailField] = providers[config.key].contactEmail;
      providerPayload[config.contactPhoneField] = providers[config.key].contactPhone;
    }

    const res = await fetch(`/api/conversions/${conversion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility_name: facilityName,
        go_live_date: goLiveDate,
        adp: adp === "" ? null : adp,
        ...contactPayload,
        ...providerPayload,
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

      <h2>Facility details</h2>
      <div className="inline-form field-row">
        <label>
          ADP
          <input
            type="number"
            value={adp}
            onChange={(e) => setAdp(e.target.value)}
          />
        </label>
      </div>
      <div className="contacts-grid">
        {PROVIDER_CONFIGS.map((config) => (
          <div className="contact-card" key={config.key}>
            <h3>{config.label}</h3>
            <label>
              {config.nameLabel}
              <input
                type="text"
                value={providers[config.key].name}
                onChange={(e) => updateProvider(config.key, "name", e.target.value)}
              />
            </label>
            <label>
              Contact name
              <input
                type="text"
                value={providers[config.key].contactName}
                onChange={(e) =>
                  updateProvider(config.key, "contactName", e.target.value)
                }
              />
            </label>
            <label>
              Contact email
              <input
                type="email"
                value={providers[config.key].contactEmail}
                onChange={(e) =>
                  updateProvider(config.key, "contactEmail", e.target.value)
                }
              />
            </label>
            <label>
              Contact phone
              <input
                type="tel"
                value={providers[config.key].contactPhone}
                onChange={(e) =>
                  updateProvider(config.key, "contactPhone", e.target.value)
                }
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
