export type DocumentCategory = "financial" | "site_build";
export type DocumentStatus = "not_sent" | "sent" | "received" | "approved";
export type IssueClassification = "resolvable_onsite" | "needs_escalation";

export interface Conversion {
  id: string;
  facility_name: string;
  go_live_date: string; // ISO date (yyyy-mm-dd)
  created_at: string;
  main_contact_name: string | null;
  main_contact_email: string | null;
  main_contact_phone: string | null;
  finance_contact_name: string | null;
  finance_contact_email: string | null;
  finance_contact_phone: string | null;
  it_contact_name: string | null;
  it_contact_email: string | null;
  it_contact_phone: string | null;
}

export type ContactRole = "main" | "finance" | "it";

export interface DocumentRow {
  id: string;
  conversion_id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  date_sent: string | null;
  date_last_reminded: string | null;
}

export interface Issue {
  id: string;
  conversion_id: string;
  description: string;
  classification: IssueClassification | null;
  date_logged: string;
  resolved: boolean;
  date_resolved: string | null;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  comment: string;
  created_at: string;
}

export type HardwareStatus = "not_ordered" | "ordered" | "shipped" | "delivered";

export interface HardwareItem {
  id: string;
  conversion_id: string;
  item_name: string;
  status: HardwareStatus;
  expected_delivery_date: string | null;
}

export type SettingStatus =
  | "completed"
  | "not_completed"
  | "awaiting_information"
  | "not_applicable";

export interface SettingRow {
  id: string;
  conversion_id: string;
  setting_name: string;
  status: SettingStatus;
}

// Fixed checklist populated once per conversion at creation time.
export const SETTING_NAMES = [
  "create site",
  "create section(s)",
  "build/assign warehouse",
  "commission rates",
  "communication rates",
  "deposit split",
  "indigent parameters",
  "deposit fees",
  "enable picking",
  "bail deposits",
  "deposit types",
  "lobby setup",
  "pin/facial settings",
  "deposit limits",
  "canteen limits",
  "KYC",
  "indigent orders",
  "Stripe settings",
  "station settings",
  "commissary menus & restrictions",
  "check setup",
  "facility agreements",
  "vendors & charges",
  "user accounts",
] as const;
