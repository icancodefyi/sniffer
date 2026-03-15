import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { recordClaimEvent } from "@/lib/claim-tracker";

interface SaveBody {
  caseId?: string;
  domain?: string;
  caseRef?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session!.user as { id: string }).id;
  const body = (await req.json()) as SaveBody;
  const { caseId, domain, caseRef } = body;

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const now = new Date();
  const createdAtSec = Math.floor(now.getTime() / 1000);
  const col = client.db("snifferX").collection("cases");

  // Upsert the case shell if needed and mark this user as having saved it.
  await col.updateOne(
    { case_id: caseId },
    {
      $set: {
        case_ref: caseRef ?? null,
        platform_source: domain ?? "Other",
        updated_at: now,
        last_saved_at: now,
      },
      $setOnInsert: {
        case_id: caseId,
        created_at: createdAtSec,
        status: "pending",
        issue_type: "Other",
        pipeline_type: "deepfake",
        anonymous: true,
        no_further_tracking: false,
      },
      $addToSet: {
        saved_by_users: userId,
      },
    },
    { upsert: true },
  );

  await recordClaimEvent({
    eventType: "case_saved",
    caseId,
    platformSource: domain ?? undefined,
    source: "api",
  }).catch(() => {
    // Saving a case should succeed even if metrics tracking fails
  });

  return NextResponse.json({ ok: true });
}
