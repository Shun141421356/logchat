import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { groups, channels } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.ownerId, session.userId));

  const result = await Promise.all(
    allGroups.map(async (g) => {
      const chs = await db
        .select()
        .from(channels)
        .where(eq(channels.groupId, g.id));
      return { ...g, channels: chs };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "グループ名が必要です" }, { status: 400 });

  const [group] = await db
    .insert(groups)
    .values({ name, description, ownerId: session.userId })
    .returning();

  return NextResponse.json({ ...group, channels: [] });
}
