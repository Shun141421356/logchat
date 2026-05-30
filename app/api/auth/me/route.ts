import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db
    .select({ id: users.id, username: users.username, avatarColor: users.avatarColor })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return NextResponse.json({ user: user || null });
}
