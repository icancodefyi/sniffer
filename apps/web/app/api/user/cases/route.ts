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
  const col = client.db("snifferX").collection("saved_cases");
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");

  if (caseId) {
    // Single-case saved check
    const doc = await col.findOne({ userId, caseId });
    return NextResponse.json({ saved: !!doc });
  }

  // All cases for this user
  const cases = await col
    .find({ userId })
    .sort({ savedAt: -1 })
    .project({ _id: 0 })
    .toArray();

  return NextResponse.json({ cases });
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
  await client
    .db("snifferX")
    .collection("saved_cases")
    .deleteOne({ userId, caseId });

  return NextResponse.json({ ok: true });
}
