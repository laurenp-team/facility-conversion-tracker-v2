import type { DocumentCategory } from "./types";

// Commonly-requested document names per category, used to populate the
// "Add document" dropdown. Not part of the schema — just UI convenience.
// "Other" (handled in the form component) lets you type anything not listed.
export const DOCUMENT_NAME_OPTIONS: Record<DocumentCategory, string[]> = {
  financial: [
    "ACH Form",
    "Debit Release Form",
    "Check Layout",
    "Stripe Form",
    "New Account Refusal Form",
  ],
  site_build: [
    "Users",
    "Group Permissions",
    "Commissary List",
    "Restrictions",
    "Site Charges",
    "Site Settings",
    "Firewall Guide",
  ],
};

export const OTHER_OPTION = "__other__";
