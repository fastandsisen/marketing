"use client";
import { useState } from "react";
import PromotionPanel from "./PromotionPanel";
import JapanVsForeignPie from "./JapanVsForeignPie";

export default function PromoBridge({
  name,
  keywords,
  videos,
  ytApiKey,
}: {
  name: string;
  keywords: string[];
  videos: Array<{ id: string; title: string }>;
  ytApiKey: string;
}) {
  const [shares, setShares] = useState<
    Array<{ code: string; name: string; views: number; pct: number }>
  >([]);

  return (
    <>
      <JapanVsForeignPie
        videoIds={videos.map((v) => v.id)}
        apiKey={ytApiKey}
        englishToUSFallback
        onSharesReady={setShares} // ← グラフ計算完了でここに入る
      />
      <PromotionPanel
        name={name}
        keywords={keywords}
        videos={videos}
        shares={shares}
      />
      <div style={{ marginTop: "2rem" }}></div>
    </>
  );
}
