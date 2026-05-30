import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { channels, groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const { isArchived } = await req.json();

  // チャンネルのグループオーナー確認
  const [channel] = await db
    .select({ id: channels.id, groupId: channels.groupId })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, channel.groupId), eq(groups.ownerId, session.userId)))
    .limit(1);

  if (!group) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [updated] = await db
    .update(channels)
    .set({ isArchived })
    .where(eq(channels.id, channelId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;

  const [channel] = await db
    .select({ id: channels.id, groupId: channels.groupId })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, channel.groupId), eq(groups.ownerId, session.userId)))
    .limit(1);

  if (!group) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(channels).where(eq(channels.id, channelId));
  return NextResponse.json({ ok: true });
}
