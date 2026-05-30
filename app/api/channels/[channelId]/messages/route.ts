import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const msgs = await db
    .select({
      id: messages.id,
      content: messages.content,
      imageUrl: messages.imageUrl,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      userId: messages.userId,
      username: users.username,
      avatarColor: users.avatarColor,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.channelId, channelId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return NextResponse.json(msgs.reverse());
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const { content, imageUrl } = await req.json();

  if (!content?.trim() && !imageUrl) {
    return NextResponse.json({ error: "コンテンツが必要です" }, { status: 400 });
  }

  const [msg] = await db
    .insert(messages)
    .values({
      content: content || "",
      imageUrl,
      channelId,
      userId: session.userId,
    })
    .returning();

  const [user] = await db
    .select({ username: users.username, avatarColor: users.avatarColor })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return NextResponse.json({
    ...msg,
    username: user?.username,
    avatarColor: user?.avatarColor,
  });
}
