import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { channels, groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, groupId } = await req.json();
  if (!name || !groupId) {
    return NextResponse.json({ error: "チャンネル名とグループIDが必要です" }, { status: 400 });
  }

  // 権限確認
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, session.userId)))
    .limit(1);

  if (!group) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [channel] = await db
    .insert(channels)
    .values({ name, description, groupId })
    .returning();

  return NextResponse.json(channel);
}
