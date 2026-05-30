import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;

  const [msg] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.userId, session.userId)))
    .limit(1);

  if (!msg) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  await db.delete(messages).where(eq(messages.id, messageId));
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "コンテンツが必要です" }, { status: 400 });
  }

  const [msg] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.userId, session.userId)))
    .limit(1);

  if (!msg) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const [updated] = await db
    .update(messages)
    .set({ content, editedAt: new Date() })
    .where(eq(messages.id, messageId))
    .returning();

  return NextResponse.json(updated);
}
