"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Conversion Record" },
  { href: "/documents", label: "Documents" },
  { href: "/issues", label: "Issue Log" },
  { href: "/hardware", label: "Hardware" },
  { href: "/settings", label: "Settings" },
  { href: "/onsite-schedule", label: "Onsite Schedule" },
];

export function ConversionTabs({ conversionId }: { conversionId: string }) {
  const pathname = usePathname();
  const base = `/conversions/${conversionId}`;

  return (
    <nav className="conversion-tabs">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href || "record"}
            href={href}
            className={`conversion-tab${isActive ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
