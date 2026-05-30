import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, session.userId)))
    .limit(1);

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(groups).where(eq(groups.id, groupId));
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const { name, description } = await req.json();

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, session.userId)))
    .limit(1);

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(groups)
    .set({ name, description })
    .where(eq(groups.id, groupId))
    .returning();

  return NextResponse.json(updated);
}
