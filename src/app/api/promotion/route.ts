// app/api/promotion/route.ts
import { NextResponse } from "next/server";
import { proposePromotion } from "@/app/lib/gem"; // 手順1で追記した関数

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, keywords, topVideos, audienceShares } = body as {
      name: string;
      keywords: string[];
      topVideos: Array<{ id: string; title: string }>;
      audienceShares: Array<{
        code: string;
        name: string;
        views: number;
        pct: number;
      }>;
    };

    const suggestion = await proposePromotion({
      name,
      keywords,
      topVideos,
      audienceShares,
    });
    return NextResponse.json({ suggestion });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "failed" },
      { status: 500 }
    );
  }
}
