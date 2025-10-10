export const dynamic = "force-dynamic"; // キャッシュせず常に最新結果を取得
import Link from "next/link";
import { STOP_WORDS } from "@/app/components/stopWords";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { headers } from "next/headers";
import { filterWithGemini } from "@/app/components/gem";

type SP = Record<string, string | string[] | undefined>;

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const name = getOne(sp.name) ?? "";
  const API_KEY = process.env.YT_API_KEY!;

  if (!name) {
    return ui(
      <>
        <Header />
        <h2>名前（タグ）が指定されていません</h2>
        <p>フォームから入力してもう一度お試しください。</p>
        <Footer />
      </>
    );
  }

  if (!API_KEY) {
    return ui(
      <>
        <Header />
        <h2>YT_API_KEY が設定されていません</h2>
        <p>
          .env.local に <code>YT_API_KEY</code> を設定してください。
        </p>
        <Footer />
      </>
    );
  }

  // ===== YouTube APIで100件（50件×2ページ）取得 =====
  const titles: string[] = [];
  let nextPageToken: string | undefined;

  for (let page = 0; page < 1; page++) {
    const qs = new URLSearchParams({
      key: API_KEY,
      part: "snippet",
      q: `%23${name}`, // ハッシュタグ検索（#をURLエンコードで表現）
      type: "video",
      maxResults: "50",
      order: "viewCount", // 再生数の多い順に取得
    });
    if (nextPageToken) qs.set("pageToken", nextPageToken);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${qs.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return ui(
        <>
          <h2>YouTube API エラー</h2>
          <pre>{text}</pre>
          <BackHome />
        </>
      );
    }

    const json = await res.json();
    for (const item of json.items ?? []) {
      const t = item?.snippet?.title;
      if (typeof t === "string") titles.push(t);
    }

    nextPageToken = json.nextPageToken;
    if (!nextPageToken) break;
  }

  // ===== タイトルから単語頻度集計 =====
  const freq = countWords(titles);
  const ranked = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([token, count], i) => ({ rank: i + 1, token, count }));

  // ... 20語の ranked を作成済みとする
  const top20 = ranked.map((r) => r.token).slice(0, 20);

  // Geminiで 10語へ絞る
  const refined = await filterWithGemini(top20);

  // ===== 表示 =====
  return ui(
    <>
      <h3>Geminiが選んだ適切な10語</h3>
      <ul>
        {refined.length > 0 ? (
          refined.map((w: string, i: number) => (
            <li key={i}>
              {i + 1}位：{w}
            </li>
          ))
        ) : (
          <li>抽出できませんでした</li>
        )}
      </ul>

      <BackHome />
    </>
  );
}

/* ---------- ユーティリティ ---------- */

function ui(children: React.ReactNode) {
  return <div style={{ padding: "1rem", lineHeight: 1.8 }}>{children}</div>;
}

function BackHome() {
  return (
    <p style={{ marginTop: "1rem" }}>
      <Link href="/">フォームに戻る</Link>
    </p>
  );
}

function getOne(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

/** 日本語/英語トークナイズ＋ストップワード除去 */
function countWords(titles: string[]) {
  const freq: Record<string, number> = {};

  for (const title of titles) {
    const norm = title
      .replace(/\s+/g, " ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[【】\[\]（）()「」『』、。,.!?:;~…]/g, " ")
      .trim();

    const tokens = [
      ...norm.matchAll(
        /#[\p{L}\p{N}_]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2,}|[\p{Alphabetic}\p{Number}]{2,}/gu
      ),
    ].map((m) => m[0].toLowerCase());

    for (let tok of tokens) {
      if (tok.startsWith("#")) tok = tok.slice(1);
      if (tok.length < 2 || /^\d+$/.test(tok)) continue;
      if (STOP_WORDS.has(tok)) continue;
      freq[tok] = (freq[tok] ?? 0) + 1;
    }
  }

  return freq;
}
