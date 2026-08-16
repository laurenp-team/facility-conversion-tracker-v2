import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Conversion, Issue, IssueComment } from "@/lib/types";
import { IssueForm } from "./issue-form";
import { IssuesTable } from "./issues-table";

export const dynamic = "force-dynamic";

export default async function IssueLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [conversionResult, issuesResult] = await Promise.all([
    supabase.from("conversions").select("*").eq("id", id).single(),
    supabase
      .from("issues")
      .select("*")
      .eq("conversion_id", id)
      .order("date_logged", { ascending: false }),
  ]);

  const conversion = conversionResult.data as Conversion | null;
  const issues = issuesResult.data as Issue[] | null;

  if (conversionResult.error || !conversion) {
    notFound();
  }

  // needs_escalation first — those are blocked on something outside your
  // control and need follow-up soonest. Stable sort preserves the existing
  // date_logged-desc order within each classification.
  const classificationRank: Record<string, number> = {
    needs_escalation: 0,
    resolvable_onsite: 1,
  };
  const openIssues = (issues ?? [])
    .filter((issue) => !issue.resolved)
    .sort(
      (a, b) =>
        (classificationRank[a.classification ?? ""] ?? 2) -
        (classificationRank[b.classification ?? ""] ?? 2)
    );

  const issueIds = (issues ?? []).map((issue) => issue.id);
  const commentsByIssueId: Record<string, IssueComment[]> = {};

  if (issueIds.length > 0) {
    const { data: comments } = await supabase
      .from("issue_comments")
      .select("*")
      .in("issue_id", issueIds)
      .order("created_at", { ascending: true })
      .returns<IssueComment[]>();

    for (const comment of comments ?? []) {
      (commentsByIssueId[comment.issue_id] ??= []).push(comment);
    }
  }

  return (
    <>
      <h1>Issue Log — {conversion.facility_name}</h1>

      <IssueForm conversionId={id} />

      {issuesResult.error && (
        <p className="error">Failed to load issues: {issuesResult.error.message}</p>
      )}
      {!issuesResult.error && (
        <>
          <h2>Open issues</h2>
          <IssuesTable
            issues={openIssues}
            commentsByIssueId={commentsByIssueId}
            emptyMessage="No open issues."
          />

          <h2>Resolved issues</h2>
          <IssuesTable
            issues={(issues ?? []).filter((issue) => issue.resolved)}
            commentsByIssueId={commentsByIssueId}
            emptyMessage="No resolved issues yet."
          />
        </>
      )}
    </>
  );
}
