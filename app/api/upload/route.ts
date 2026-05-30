import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Base64の最大サイズ: 約4MB（元画像〜3MB）
const MAX_BASE64_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageData, mimeType } = await req.json();

  if (!imageData) {
    return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
  }

  if (imageData.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: "画像サイズが大きすぎます（最大3MB）" }, { status: 413 });
  }

  const dataUrl = `data:${mimeType || "image/png"};base64,${imageData}`;
  return NextResponse.json({ url: dataUrl });
}
