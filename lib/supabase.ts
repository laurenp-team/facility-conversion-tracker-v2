import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key. This app has no
// end-user auth, so every read/write goes through server-side routes/pages
// using this client rather than exposing Supabase directly to the browser.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
  );
}

export const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
