// components/gem.ts
export async function filterWithGemini(
  name: string,
  words: string[]
): Promise<string[]> {
  const key = process.env.GEM_API_KEY;
  const top20 = (words ?? [])
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (!key) return top20.slice(0, 10);
  if (top20.length === 0) return [];

  const url =
    `https://generativelanguage.googleapis.com/` +
    `v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;

  const STOPWORDS = [
    // ここに既存STOP_WORDSのうち英語・凡庸語を中心に 50〜200語だけ注入（長すぎると逆効果）
    "the",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "by",
    "from",
    "amp",
    "ver",
    "www",
    "official",
    "video",
    "clip",
    "shorts",
    "day",
    "part",
    "part1",
    "日本",
    "人気",
    "おすすめ",
    "解説",
    "完全版",
    "保存版",
    "まとめ",
    "紹介",
    "実況",
    "動画",
    "配信",
  ];

  const NEG_GENERIC = [
    // “観光地共通で凡庸”な語を追加（出力禁止または強い減点）
    "旅行",
    "観光",
    "温泉",
    "温泉街",
    "グルメ",
    "食べ歩き",
    "カフェ",
    "ホテル",
    "旅館",
    "美味しい",
    "絶景",
    "おすすめスポット",
    "レビュー",
    "Vlog",
    "まとめ",
    "完全攻略",
  ];

  const prompt = `
あなたは候補語から「その対象を特徴づける固有で説明力の高い語」を抽出するエキスパートです。
下の候補リストは重要度順です。この中から **意味の通る語** だけを選び、重複を統合して上位20個のJSON配列のみを返してください。

# 対象
クエリ: "${name}"（地名/人物/作品など）

# 入力候補（重要度高→低）
${top20.join(", ")}

# 選定ルール
- 必ず **上記の候補の中からのみ** 選ぶ（新規語の創作は禁止）。
- できるだけ **固有名詞/施設名/名所/イベント名/名物/体験** を優先（例: 「湯畑」「熱乃湯」「ゆもみ」）。
- **凡庸語・汎用タグ** は除外（例: ${NEG_GENERIC.slice(0, 8).join(
    "、"
  )} など）。
- ひらがな/カタカナ/ローマ字の **表記差は統合** して最も一般的な表記を1つだけ選ぶ。
- **似た語**（例：”草津”と“kusatsu”）は1つにまとめ、より代表的な方を選ぶ。
- **多様性**：同じカテゴリに偏らないよう、可能なら
  - 名所/施設 8〜12語、体験/アクティビティ 4〜6語、名物/グルメ 2〜4語、イベント/キャラ 2〜3語 程度を目安にバランスよく。
- 下記の **除外リスト** に該当する語は選ばない：${STOPWORDS.join(", ")}。
- 出力は **重複なし/20個以内**。20個未満しか妥当が無い場合は無理に埋めない。
- もう一度言います。できるだけ **固有名詞/施設名/名所/イベント名/名物/体験** を優先（例: 「湯畑」「熱乃湯」「ゆもみ」）。

# 出力フォーマット（厳守）
- JSON配列のみ（説明文・コメント・コードブロック禁止）
- 例：["湯畑","熱乃湯","西の河原公園", ...]

`.trim();

  console.log(top20);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) return top20.slice(0, 20);

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log(text);

    const parsed = parseJsonArray(text);
    return parsed.length ? parsed.slice(0, 20) : top20.slice(0, 20);
  } catch {
    return top20.slice(0, 20);
  }
}

/** コードフェンス付きでも素直に配列を取り出すだけの軽量パーサ */
function parseJsonArray(text: string): string[] {
  if (!text) return [];
  let s = text
    .trim()
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");

  try {
    const v = JSON.parse(s);
    if (Array.isArray(v))
      return v
        .map(String)
        .map((x) => x.trim())
        .filter(Boolean);
  } catch {}

  const m = s.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      const v = JSON.parse(m[0]);
      if (Array.isArray(v))
        return v
          .map(String)
          .map((x) => x.trim())
          .filter(Boolean);
    } catch {}
  }
  return [];
}

type PromoInput = {
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

export async function proposePromotion(input: PromoInput): Promise<string> {
  const key = process.env.GEM_API_KEY;

  // キー未設定時のフォールバック（サンプル文）
  if (!key) {
    return [
      `1) マーケティング戦略：『${input.name}』の“ここでしかできない体験”を前面に。`,
      `2) 推奨プラットフォーム：YouTube（比較/レビュー） / TikTok（15–30秒ハイライト） / Instagram（写真×Reels） / X（速報企画）`,
      `3) クリエイティブ：①冒頭3秒でベネフィット ②大きなテロップ ③人物＋動きのサムネ`,
      `4) CTA/投稿例：\n> 今週末は「${input.name}」へ。#体験レポ で投稿すると○○をプレゼント！`,
    ].join("\n");
  }

  const url =
    `https://generativelanguage.googleapis.com/` +
    `v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;

  const prompt = `
あなたは動画プロモーションのストラテジストです。
「キーワード」「人気動画の傾向」「視聴者の国の比率」から、
何を・どのプラットフォームで・どんなクリエイティブで宣伝するかを提案してください。

制約:
- 箇条書きで簡潔に（最大8項目）
- プラットフォーム選定は根拠（国や言語圏の相性など）を1行で添える
- 実行しやすいCTAと投稿例テンプレを最後に1つ、引用で出す
- 最大限読みやすくすること

入力:
- テーマ: ${input.name}
- 上位キーワード: ${input.keywords.slice(0, 20).join(", ")}
- 人気動画(上位5): ${input.topVideos
    .slice(0, 5)
    .map((v) => v.title)
    .join(" / ")}
- 視聴者の国シェア: ${input.audienceShares
    .map((s) => `${s.name}:${s.pct}%`)
    .join(", ")}

出力フォーマット:
1) マーケティング戦略（1行）
2) 推奨プラットフォーム×コンテンツ（3〜5項目、各1-2行）
3) デザイン要件（1-3項目）
4) 投稿例（引用形式で1つ）
`.trim();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error("gemini error");

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text || "（提案が生成できませんでした）";
  } catch {
    return "（提案の生成に失敗しました。時間をおいてお試しください）";
  }
}
