import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  Conversion,
  OnsiteRequirement,
  OnsiteTeamMember,
  Training,
} from "@/lib/types";
import { OnsiteRequirementsTable } from "../onsite-requirements-table";
import { OnsiteTeamList } from "../onsite-team-list";
import { TrainingsTable } from "../trainings-table";

export const dynamic = "force-dynamic";

export default async function OnsiteSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [conversionResult, requirementsResult, teamResult, trainingsResult] =
    await Promise.all([
      supabase.from("conversions").select("*").eq("id", id).single(),
      supabase
        .from("onsite_requirements")
        .select("*")
        .eq("conversion_id", id)
        .order("requirement_name"),
      supabase.from("onsite_team").select("*").eq("conversion_id", id).order("staff_name"),
      supabase
        .from("trainings")
        .select("*")
        .eq("conversion_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
    ]);

  const conversion = conversionResult.data as Conversion | null;
  const requirements = requirementsResult.data as OnsiteRequirement[] | null;
  const team = teamResult.data as OnsiteTeamMember[] | null;
  const trainings = trainingsResult.data as Training[] | null;

  if (conversionResult.error || !conversion) {
    notFound();
  }

  return (
    <>
      <h1>Onsite Schedule — {conversion.facility_name}</h1>

      <h2>Facility requirements</h2>
      {requirementsResult.error && (
        <p className="error">
          Failed to load requirements: {requirementsResult.error.message}
        </p>
      )}
      <OnsiteRequirementsTable
        conversionId={id}
        initialRequirements={requirements ?? []}
      />

      <h2>Team onsite</h2>
      {teamResult.error && (
        <p className="error">Failed to load team: {teamResult.error.message}</p>
      )}
      <OnsiteTeamList conversionId={id} initialTeam={team ?? []} />

      <h2>Trainings</h2>
      {trainingsResult.error && (
        <p className="error">
          Failed to load trainings: {trainingsResult.error.message}
        </p>
      )}
      <TrainingsTable conversionId={id} initialTrainings={trainings ?? []} />
    </>
  );
}
