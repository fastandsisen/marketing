"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

/** 1%以下を「その他」にまとめる */
const SMALL_PCT_THRESHOLD = 1;

type YTVideo = {
  id: string;
  snippet: {
    channelId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    title?: string;
    description?: string;
  };
  statistics?: { viewCount?: string };
};

type YTChannel = {
  id: string;
  snippet?: { country?: string };
  brandingSettings?: { channel?: { country?: string } };
};

type PieRow = { key: string; name: string; value: number; pct?: number };

export type JapanVsForeignPieProps = {
  videoIds: string[];
  apiKey: string;
  height?: number;
  englishToUSFallback?: boolean;
  collapseUnknownIntoOther?: boolean;
  onSharesReady?: (
    rows: Array<{ code: string; name: string; views: number; pct: number }>
  ) => void;
};

/** ISO2国コードのホワイトリスト（必要に応じて追加） */
const ISO2 = new Set([
  "JP",
  "US",
  "CN",
  "KR",
  "TW",
  "HK",
  "GB",
  "DE",
  "FR",
  "IT",
  "ES",
  "IN",
  "ID",
  "TH",
  "VN",
  "PH",
  "MY",
  "SG",
  "AU",
  "CA",
  "BR",
  "MX",
  "SA",
  "RU",
  "IL",
  "TR",
  "GR",
  "PT",
  "PL",
  "NL",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "CH",
  "CZ",
  "HU",
  "SK",
  "RO",
  "AT",
  "BE",
  "AR",
  "CL",
  "PE",
  "NZ",
  "AE",
  "QA",
]);

/** 国コードを正規化：大文字化＋例外補正。ISO外は undefined を返す */
function normalizeCountry(code?: string | null): string | undefined {
  if (!code || typeof code !== "string") return undefined;
  let cc = code.trim().toUpperCase();
  if (cc === "UK") cc = "GB"; // 例外補正
  if (cc.length !== 2) return undefined;
  return ISO2.has(cc) ? cc : undefined;
}

async function fetchVideosByIds(
  ids: string[],
  apiKey: string
): Promise<YTVideo[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

  const out: YTVideo[] = [];
  for (const chunk of chunks) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${chunk.join(
        ","
      )}&key=${apiKey}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    out.push(...((json.items || []) as YTVideo[]));
  }
  return out;
}

async function fetchChannelsByIds(
  ids: string[],
  apiKey: string
): Promise<Record<string, YTChannel>> {
  if (ids.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  const results: Record<string, YTChannel> = {};
  for (const chunk of chunks) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${chunk.join(
        ","
      )}&key=${apiKey}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    for (const ch of (json.items || []) as YTChannel[]) results[ch.id] = ch;
  }
  return results;
}

/** チャンネルの国コード（brandingSettings 優先）→ 正規化して返す */
function pickCountry(ch?: YTChannel): string | undefined {
  const fromBranding = normalizeCountry(ch?.brandingSettings?.channel?.country);
  const fromSnippet = normalizeCountry(ch?.snippet?.country);
  return fromBranding ?? fromSnippet ?? undefined;
}

/** 文字スクリプトでの判定補助 */
const REG = {
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/, // かな・漢字
  ko: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/, // ハングル
  ru: /[\u0400-\u04FF]/, // キリル
  ar: /[\u0600-\u06FF]/, // アラビア
  th: /[\u0E00-\u0E7F]/, // タイ
  hi: /[\u0900-\u097F]/, // デーヴァナーガリー
  he: /[\u0590-\u05FF]/, // ヘブライ
  el: /[\u0370-\u03FF]/, // ギリシャ
  vi: /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ]/i, // ベトナム拡張ラテン
};

/** 動画の言語/テキストから国を推定（不足時の補完）→ ISOを保証 */
function guessCountry(
  video: YTVideo,
  opts: { englishToUSFallback: boolean }
): string | undefined {
  const lang = (
    video.snippet.defaultAudioLanguage ||
    video.snippet.defaultLanguage ||
    ""
  ).toLowerCase();
  const text = `${video.snippet.title ?? ""} ${
    video.snippet.description ?? ""
  }`;

  let cc: string | undefined;

  // 言語コードからの推定（必要最低限）
  if (lang.startsWith("zh")) {
    if (lang.includes("hans") || lang.endsWith("-cn") || lang === "zh-cn")
      cc = "CN";
    else if (lang.includes("hant") || lang.endsWith("-tw") || lang === "zh-tw")
      cc = "TW";
    else if (lang.endsWith("-hk")) cc = "HK";
    else cc = "CN";
  } else if (lang.startsWith("ja")) cc = "JP";
  else if (lang.startsWith("ko")) cc = "KR";
  else if (lang.startsWith("th")) cc = "TH";
  else if (lang.startsWith("vi")) cc = "VN";
  else if (lang.startsWith("hi")) cc = "IN";
  else if (lang.startsWith("id")) cc = "ID";
  else if (lang.startsWith("ms")) cc = "MY";
  else if (lang.startsWith("pt")) cc = "BR"; // 必要ならPTへ振り分け調整
  else if (lang.startsWith("es")) cc = "ES"; // MXへ寄せたいなら調整
  else if (lang.startsWith("fr")) cc = "FR";
  else if (lang.startsWith("de")) cc = "DE";
  else if (lang.startsWith("ru")) cc = "RU";
  else if (lang.startsWith("ar")) cc = "SA";
  else if (lang.startsWith("he")) cc = "IL";
  else if (lang.startsWith("tr")) cc = "TR";
  else if (lang.startsWith("en") && opts.englishToUSFallback) cc = "US";

  if (cc && ISO2.has(cc)) return cc;

  // テキストのスクリプトからの補完（最後の手段）
  if (REG.ja.test(text)) return "JP";
  if (REG.ko.test(text)) return "KR";
  if (REG.ru.test(text)) return "RU";
  if (REG.ar.test(text)) return "SA";
  if (REG.th.test(text)) return "TH";
  if (REG.hi.test(text)) return "IN";
  if (REG.he.test(text)) return "IL";
  if (REG.el.test(text)) return "GR";
  if (REG.vi.test(text)) return "VN";

  return undefined;
}

/** ISO国コード→日本語名（無ければそのままコード表示） */
const COUNTRY_JA_NAME: Record<string, string> = {
  JP: "日本",
  US: "アメリカ",
  CN: "中国",
  KR: "韓国",
  TW: "台湾",
  HK: "香港",
  GB: "イギリス",
  DE: "ドイツ",
  FR: "フランス",
  IT: "イタリア",
  ES: "スペイン",
  IN: "インド",
  ID: "インドネシア",
  TH: "タイ",
  VN: "ベトナム",
  PH: "フィリピン",
  MY: "マレーシア",
  SG: "シンガポール",
  AU: "オーストラリア",
  CA: "カナダ",
  BR: "ブラジル",
  MX: "メキシコ",
  SA: "サウジアラビア",
  RU: "ロシア",
  IL: "イスラエル",
  TR: "トルコ",
  GR: "ギリシャ",
};

function countryLabel(code?: string) {
  if (!code) return "不明";
  return COUNTRY_JA_NAME[code] ?? code;
}

/** 小さいスライスを「その他」にまとめる */
function groupSmallSlices(
  rows: PieRow[],
  total: number,
  thresholdPct = SMALL_PCT_THRESHOLD,
  collapseUnknownIntoOther = false
): PieRow[] {
  if (!total) return rows.map((r) => ({ ...r, pct: 0 }));

  // 「不明」を先に other へ寄せるオプション
  const baseRows = collapseUnknownIntoOther
    ? rows.filter((r) => r.key !== "Unknown")
    : rows;

  const withPct = baseRows.map((r) => ({
    ...r,
    pct: Math.round((r.value / total) * 100),
  }));

  const major = withPct.filter((r) => (r.pct ?? 0) > thresholdPct);
  const minor = withPct.filter((r) => (r.pct ?? 0) <= thresholdPct);
  const otherValue =
    minor.reduce((a, b) => a + b.value, 0) +
    (collapseUnknownIntoOther
      ? rows.find((r) => r.key === "Unknown")?.value ?? 0
      : 0);

  const merged: PieRow[] =
    otherValue > 0
      ? [...major, { key: "__OTHER__", name: "その他", value: otherValue }]
      : major;

  return merged.map((r) => ({
    ...r,
    pct: Math.round((r.value / total) * 100),
  }));
}

export default function JapanVsForeignPie({
  videoIds,
  apiKey,
  height = 320,
  englishToUSFallback = true,
  collapseUnknownIntoOther = false,
  onSharesReady,
}: JapanVsForeignPieProps) {
  const [videos, setVideos] = useState<YTVideo[] | null>(null);
  const [channelMap, setChannelMap] = useState<Record<string, YTChannel>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 動画取得（snippet + statistics）
  useEffect(() => {
    const run = async () => {
      if (!videoIds?.length) return;
      if (!apiKey) {
        setError("YouTube APIキーが未設定です");
        return;
      }
      try {
        setLoading(true);
        const vds = await fetchVideosByIds(videoIds, apiKey);
        setVideos(vds);
      } catch (e: any) {
        setError(e?.message ?? "動画の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [videoIds?.join(","), apiKey]);

  // チャンネル情報取得（snippet, brandingSettings）
  useEffect(() => {
    const run = async () => {
      const list = videos ?? [];
      if (!apiKey || list.length === 0) return;
      try {
        const channelIds = Array.from(
          new Set(list.map((v) => v.snippet.channelId))
        );
        const map = await fetchChannelsByIds(channelIds, apiKey);
        setChannelMap(map);
      } catch {
        // silent
      }
    };
    run();
  }, [videos, apiKey]);

  // 国別・再生数合算 → 1%以下（必要なら不明も）をその他へ
  const pieData = useMemo(() => {
    const list = videos ?? [];
    const totals = new Map<string, number>(); // country -> views
    for (const v of list) {
      const ch = channelMap[v.snippet.channelId];

      // 正規の国コードのみを採用（最終ガード付き）
      const codeRaw =
        pickCountry(ch) ??
        guessCountry(v, { englishToUSFallback }) ??
        "Unknown";

      const code = normalizeCountry(codeRaw) ?? "Unknown";

      const views = Number(v.statistics?.viewCount ?? "0");
      totals.set(code, (totals.get(code) ?? 0) + (isFinite(views) ? views : 0));
    }

    const totalViews = Array.from(totals.values()).reduce((a, b) => a + b, 0);

    const rows: PieRow[] = Array.from(totals.entries())
      .filter(([, v]) => v > 0)
      .map(([code, v]) => ({
        key: code,
        name: countryLabel(code === "Unknown" ? undefined : code),
        value: v,
      }))
      .sort((a, b) => b.value - a.value);

    return groupSmallSlices(
      rows,
      totalViews,
      SMALL_PCT_THRESHOLD,
      collapseUnknownIntoOther
    );
  }, [videos, channelMap, englishToUSFallback, collapseUnknownIntoOther]);

  const COLORS = [
    "#6366F1",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#8B5CF6",
    "#84CC16",
    "#F472B6",
    "#22C55E",
    "#EAB308",
  ];

  useEffect(() => {
    if (!Array.isArray(pieData)) return;
    const rows = pieData.map((r: any) => ({
      code: r.key,
      name: r.name,
      views: r.value,
      pct: r.pct ?? 0,
    }));
    onSharesReady?.(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pieData)]);

  return (
    <div style={{ width: "100%" }}>
      <h3 style={{ fontWeight: 600, margin: "0.5rem 0 0.75rem" }}>
        国別・再生数シェア
      </h3>
      {loading && <p style={{ opacity: 0.7 }}>取得中…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              dataKey="value"
              data={pieData}
              outerRadius={110}
              label={({ name, pct }: any) => `${name} ${pct}%`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                `${Number(value).toLocaleString()} 再生`
              }
              labelFormatter={(_label, payload: any) =>
                payload?.[0]?.payload?.name ?? ""
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        集計:
        チャンネル国（あれば）＋言語/テキストから補完。1%以下は「その他」にまとめます。
        {collapseUnknownIntoOther
          ? "（不明もその他へ集約）"
          : "（不明は独立表示）"}
      </p>
    </div>
  );
}
