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
  const col = client.db("snifferX").collection("saved_cases");

  // Upsert — idempotent, no duplicate saves
  await col.updateOne(
    { userId, caseId },
    {
      $setOnInsert: {
        userId,
        caseId,
        domain: domain ?? null,
        caseRef: caseRef ?? null,
        savedAt: new Date(),
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
