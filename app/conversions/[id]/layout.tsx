import Link from "next/link";
import { ConversionTabs } from "./conversion-tabs";

export default async function ConversionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="page">
      <p>
        <Link href="/">&larr; All conversions</Link>
      </p>
      <ConversionTabs conversionId={id} />
      {children}
    </main>
  );
}
