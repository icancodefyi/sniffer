import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const col = client.db("snifferX").collection("cases");
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");

  if (caseId) {
    // Single-case saved check
    const doc = await col.findOne({ case_id: caseId, saved_by_users: userId });
    return NextResponse.json({ saved: !!doc });
  }

  // All cases for this user
  const cases = await col
    .find(
      { saved_by_users: userId },
      {
        projection: {
          _id: 0,
          case_id: 1,
          case_ref: 1,
          platform_source: 1,
          last_saved_at: 1,
          updated_at: 1,
          created_at: 1,
        },
      },
    )
    .sort({ last_saved_at: -1, updated_at: -1, created_at: -1 })
    .toArray();

  const normalized = cases.map((doc) => {
    const rawSavedAt = doc.last_saved_at ?? doc.updated_at ?? doc.created_at ?? null;
    const savedAt =
      rawSavedAt instanceof Date
        ? rawSavedAt.toISOString()
        : typeof rawSavedAt === "number"
          ? new Date(rawSavedAt * 1000).toISOString()
          : typeof rawSavedAt === "string"
            ? rawSavedAt
            : null;

    return {
      caseId: typeof doc.case_id === "string" ? doc.case_id : "",
      domain: typeof doc.platform_source === "string" ? doc.platform_source : null,
      caseRef: typeof doc.case_ref === "string" ? doc.case_ref : null,
      savedAt: savedAt ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ cases: normalized });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const updateDoc: Record<string, unknown> = {
    $pull: { saved_by_users: userId },
    $set: { updated_at: new Date() },
  };

  await client
    .db("snifferX")
    .collection("cases")
    .updateOne(
      { case_id: caseId },
      updateDoc,
    );

  return NextResponse.json({ ok: true });
}
