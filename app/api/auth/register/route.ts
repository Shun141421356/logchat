import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signToken } from "@/lib/auth";
import { getRandomAvatarColor } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "全ての項目を入力してください" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json({ error: "このユーザー名は既に使用されています" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarColor = getRandomAvatarColor();

    const [user] = await db
      .insert(users)
      .values({ username, email, passwordHash, avatarColor })
      .returning();

    const token = await signToken({ userId: user.id, username: user.username });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, avatarColor: user.avatarColor },
    });
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
