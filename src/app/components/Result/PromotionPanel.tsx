"use client";
import { useState } from "react";

type Share = { code: string; name: string; views: number; pct: number };

export default function PromotionPanel({
  name,
  keywords,
  videos,
  shares,
}: {
  name: string;
  keywords: string[];
  videos: Array<{ id: string; title: string }>;
  shares: Share[];
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          keywords,
          topVideos: videos.slice(0, 5),
          audienceShares: shares,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "failed");
      setText(json.suggestion);
    } catch (e: any) {
      setError(e?.message ?? "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ margin: "2rem 0 0" }}>
      <h3 style={{ margin: "0 0 .5rem 0", color: "#1b2a4a" }}>
        📣 プロモーション提案
      </h3>
      <p style={{ fontSize: 13, opacity: 0.7, margin: "4px 0 10px" }}>
        キーワード・人気動画・視聴者の国シェアを元に、Geminiで宣伝プランを生成します。
      </p>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: 0,
          background: "#1a3ae6",
          color: "#fff",
        }}
      >
        {loading ? "生成中…" : "提案を生成"}
      </button>
      {shares.length === 0 && (
        <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>
          ※先に下の円グラフの読込完了を待ってください
        </span>
      )}
      {error && <p style={{ color: "#dc2626", marginTop: 8 }}>{error}</p>}
      {text && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </pre>
      )}
    </section>
  );
}
