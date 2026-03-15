import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

const LIFECYCLE_EVENT_TYPES = [
  "escalation_requested",
  "platform_report_submitted",
  "takedown_requested",
  "takedown_rejected",
  "content_removed_confirmed",
] as const;

function classifyLifecycle(eventType: string): "removed" | "escalated" | "rejected" | "none" {
  if (eventType === "content_removed_confirmed") return "removed";
  if (eventType === "takedown_rejected") return "rejected";
  if (
    eventType === "escalation_requested" ||
    eventType === "platform_report_submitted" ||
    eventType === "takedown_requested"
  ) {
    return "escalated";
  }
  return "none";
}

interface BreakdownItem {
  name: string;
  count: number;
  pct: number;
}

function normalizeKey(value: unknown, fallback = "Unknown"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function addPercentages(items: { name: string; count: number }[], total: number): BreakdownItem[] {
  if (total <= 0) {
    return items.map((item) => ({ ...item, pct: 0 }));
  }
  return items.map((item) => ({
    ...item,
    pct: Math.round((item.count / total) * 100),
  }));
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("snifferX");

    const casesCol = db.collection("cases");
    const eventsCol = db.collection("claim_events");
    const metricsCol = db.collection("claim_metrics");

    const [
      totalCases,
      savedCases,
      metrics,
      statusRaw,
      platformRaw,
      issueRaw,
      recentCasesRaw,
      recentEventsRaw,
      lifecycleRaw,
    ] = await Promise.all([
      casesCol.countDocuments(),
      casesCol.countDocuments({ saved_by_users: userId }),
      metricsCol.findOne({ key: "global" }, { projection: { _id: 0 } }),
      casesCol
        .aggregate<{ _id: string | null; count: number }>([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      casesCol
        .aggregate<{ _id: string | null; count: number }>([
          { $group: { _id: "$platform_source", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ])
        .toArray(),
      casesCol
        .aggregate<{ _id: string | null; count: number }>([
          { $group: { _id: "$issue_type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ])
        .toArray(),
      casesCol
        .find(
          {},
          {
            projection: {
              _id: 0,
              case_id: 1,
              case_ref: 1,
              status: 1,
              platform_source: 1,
              issue_type: 1,
              created_at: 1,
              pipeline_type: 1,
            },
          },
        )
        .sort({ created_at: -1 })
        .limit(10)
        .toArray(),
      eventsCol
        .find(
          {},
          {
            projection: {
              _id: 0,
              event_type: 1,
              case_id: 1,
              platform_source: 1,
              issue_type: 1,
              created_at: 1,
            },
          },
        )
        .sort({ created_at: -1 })
        .limit(14)
        .toArray(),
      eventsCol
        .aggregate<{ _id: string; count: number; cases: string[] }>([
          { $match: { event_type: { $in: [...LIFECYCLE_EVENT_TYPES] } } },
          { $group: { _id: "$event_type", count: { $sum: 1 }, cases: { $addToSet: "$case_id" } } },
        ])
        .toArray(),
    ]);

    const status = addPercentages(
      statusRaw.map((row) => ({
        name: normalizeKey(row._id, "Unknown"),
        count: row.count,
      })),
      totalCases,
    );

    let platforms = addPercentages(
      platformRaw.map((row) => ({
        name: normalizeKey(row._id, "Other"),
        count: row.count,
      })),
      totalCases,
    );

    // If seeded data is near-uniform, prefer recent real user creation events.
    const platformCounts = platforms.map((p) => p.count).filter((c) => c > 0);
    const nearUniformSeedLike =
      platformCounts.length >= 4 && Math.max(...platformCounts) - Math.min(...platformCounts) <= 1;

    if (nearUniformSeedLike) {
      const recentCreatedRaw = await eventsCol
        .aggregate<{ _id: string | null; count: number }>([
          { $match: { event_type: "case_created" } },
          { $group: { _id: "$platform_source", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ])
        .toArray();

      const recentTotal = recentCreatedRaw.reduce((sum, row) => sum + row.count, 0);
      if (recentTotal > 0) {
        platforms = addPercentages(
          recentCreatedRaw.map((row) => ({
            name: normalizeKey(row._id, "Other"),
            count: row.count,
          })),
          recentTotal,
        );
      }
    }

    const issueTypes = addPercentages(
      issueRaw.map((row) => ({
        name: normalizeKey(row._id, "Other"),
        count: row.count,
      })),
      totalCases,
    );

    const recentCaseIds = recentCasesRaw
      .map((row) => normalizeKey(row.case_id, ""))
      .filter((v) => v.length > 0);

    const lifecycleForRecent = recentCaseIds.length
      ? await eventsCol
          .find(
            {
              case_id: { $in: recentCaseIds },
              event_type: { $in: [...LIFECYCLE_EVENT_TYPES] },
            },
            {
              projection: {
                _id: 0,
                case_id: 1,
                event_type: 1,
                created_at: 1,
              },
            },
          )
          .sort({ created_at: -1 })
          .toArray()
      : [];

    const lifecycleByCase = new Map<string, { eventType: string; createdAt: string | null; stage: "removed" | "escalated" | "rejected" | "none" }>();
    for (const row of lifecycleForRecent) {
      const caseId = normalizeKey(row.case_id, "");
      if (!caseId || lifecycleByCase.has(caseId)) continue;
      const eventType = normalizeKey(row.event_type, "unknown");
      lifecycleByCase.set(caseId, {
        eventType,
        createdAt: toDate(row.created_at)?.toISOString() ?? null,
        stage: classifyLifecycle(eventType),
      });
    }

    const recentCases = recentCasesRaw.map((row) => {
      const caseId = normalizeKey(row.case_id, "unknown");
      const lifecycle = lifecycleByCase.get(caseId);

      return {
      caseId: normalizeKey(row.case_id, "unknown"),
      caseRef: normalizeKey(row.case_ref, "N/A"),
      status: normalizeKey(row.status, "unknown"),
      platform: normalizeKey(row.platform_source, "Other"),
      issueType: normalizeKey(row.issue_type, "Other"),
      pipelineType: normalizeKey(row.pipeline_type, "deepfake"),
      createdAt: toDate(row.created_at)?.toISOString() ?? null,
        lifecycleStage: lifecycle?.stage ?? "none",
        lifecycleEventType: lifecycle?.eventType ?? null,
        lifecycleAt: lifecycle?.createdAt ?? null,
        evidenceState: lifecycle ? "auditable" : "unverified",
      };
    });

    const recentEvents = recentEventsRaw.map((row) => ({
      eventType: normalizeKey(row.event_type, "unknown"),
      caseId: normalizeKey(row.case_id, "unknown"),
      platform: normalizeKey(row.platform_source, "Other"),
      issueType: normalizeKey(row.issue_type, "Other"),
      createdAt: toDate(row.created_at)?.toISOString() ?? null,
    }));

    const events = metrics?.events ?? {};
    const caseCreated = Number(events.case_created ?? 0);
    const caseSaved = Number(events.case_saved ?? 0);
    const reportViewed = Number(events.report_viewed ?? 0);

    const deepfakeRate =
      totalCases > 0
        ? Math.round(
            Math.min(
              100,
              ((status.find((item) => item.name.toLowerCase() === "confirmed")?.count ?? 0) /
                totalCases) *
                100,
            ),
          )
        : 0;

    const lifecycleEventCounts: Record<string, number> = {};
    const lifecycleCaseIds = new Set<string>();
    for (const row of lifecycleRaw) {
      lifecycleEventCounts[row._id] = row.count;
      for (const caseId of row.cases ?? []) {
        const normalized = normalizeKey(caseId, "");
        if (normalized) lifecycleCaseIds.add(normalized);
      }
    }

    const evidenceCoveragePct =
      totalCases > 0 ? Math.round((lifecycleCaseIds.size / totalCases) * 100) : 0;

    return NextResponse.json({
      totals: {
        totalCases,
        savedCases,
        totalEvents: Number(metrics?.total_events ?? 0),
        caseCreated,
        caseSaved,
        reportViewed,
        deepfakeRate,
        casesWithLifecycleEvidence: lifecycleCaseIds.size,
        evidenceCoveragePct,
        updatedAt: metrics?.updated_at ? new Date(metrics.updated_at).toISOString() : null,
      },
      breakdown: {
        status,
        platforms,
        issueTypes,
        lifecycle: [
          {
            name: "Escalation Events",
            count:
              Number(lifecycleEventCounts.escalation_requested ?? 0) +
              Number(lifecycleEventCounts.platform_report_submitted ?? 0) +
              Number(lifecycleEventCounts.takedown_requested ?? 0),
            pct: 0,
          },
          {
            name: "Removal Confirmations",
            count: Number(lifecycleEventCounts.content_removed_confirmed ?? 0),
            pct: 0,
          },
          {
            name: "Rejection Events",
            count: Number(lifecycleEventCounts.takedown_rejected ?? 0),
            pct: 0,
          },
        ],
      },
      recentCases,
      recentEvents,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard overview" }, { status: 500 });
  }
}
