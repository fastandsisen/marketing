export const dynamic = "force-dynamic"; // キャッシュせず常に最新結果を取得
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { filterWithGemini } from "@/app/lib/gem";
import BackHome from "@/app/components/BackHome";
import RankingSection from "@/app/components/Result/RankingSection";
import VideoSection from "@/app/components/Result/VideoSection";
import { countWords } from "@/app/lib/countWords";
import PromoBridge from "@/app/components/Result/PromoBridge";
import { toRomaji } from "wanakana"; // かな→ローマ字の軽量変換

type SP = Record<string, string | string[] | undefined>;

type SimpleVideo = { title: string; id: string };

// ---- 可能なら漢字も含めてローマ字化（失敗時は軽量版にフォールバック） ----
async function getRomaji(input: string): Promise<string> {
  const hasKanji = /[一-龥]/.test(input);
  try {
    if (hasKanji) {
      const { default: Kuroshiro } = await import("kuroshiro");
      const { default: KuromojiAnalyzer } = await import(
        "kuroshiro-analyzer-kuromoji"
      );
      const kuro = new Kuroshiro();
      await kuro.init(new KuromojiAnalyzer());
      const out = await kuro.convert(input, {
        to: "romaji",
        mode: "spaced",
        romajiSystem: "hepburn",
      });
      return out.trim();
    }
  } catch {
    // 解析失敗時は軽量版へフォールバック
  }
  // かな入力などは軽量版で十分
  return toRomaji(input).trim();
}

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

  // ====== クエリ拡張（日本語とローマ字の両方で検索） ======
  const queries: string[] = [name];
  const romaji = await getRomaji(name);
  if (romaji && romaji.toLowerCase() !== name.toLowerCase()) {
    queries.push(romaji);
    const romajiCompact = romaji.replace(/\s+/g, "");
    if (romajiCompact && romajiCompact !== romaji) queries.push(romajiCompact);
  }

  // ===== YouTube APIで取得（50件× ここでは1ページ × クエリ数） =====
  const titles: string[] = [];
  const videos: SimpleVideo[] = [];
  const seen = new Set<string>(); // videoId 重複排除

  for (const q of queries) {
    let nextPageToken: string | undefined;
    for (let page = 0; page < 1; page++) {
      const qs = new URLSearchParams({
        key: API_KEY,
        part: "snippet",
        q, // ← name 固定ではなく、拡張クエリを使用
        type: "video",
        maxResults: "50",
        order: "viewCount",
        relevanceLanguage: "ja", // 日本語寄せ（任意）
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
            <Header />
            <h2>YouTube API エラー</h2>
            <pre>{text || "クオータがなくなりました"}</pre>
            <BackHome />
            <Footer />
          </>
        );
      }

      const json = await res.json();
      for (const item of json.items ?? []) {
        const lbc = item?.snippet?.liveBroadcastContent;
        if (lbc && lbc !== "none") continue;
        const t = item?.snippet?.title as string | undefined;
        const id = item?.id?.videoId as string | undefined;
        if (!t || !id) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        titles.push(t);
        videos.push({ title: t, id });
      }

      nextPageToken = json.nextPageToken;
      if (!nextPageToken) break;
    }
  }

  // ===== タイトルから単語頻度集計 =====
  const freq = countWords(name, titles);
  const ranked = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([token, count], i) => ({ rank: i + 1, token, count }));

  const top50 = ranked.map((r) => r.token).slice(0, 50);

  // Geminiで絞り込み
  const refined = await filterWithGemini(name, top50);

  // ===== 表示 =====
  return ui(
    <>
      {refined.length > 0 ? (
        <RankingSection name={name} refined={refined} />
      ) : (
        <p style={{ color: "gray" }}>抽出できませんでした</p>
      )}

      {videos.length > 0 && <VideoSection videos={videos} />}

      <div style={{ marginTop: "2rem" }}></div>
      <PromoBridge
        name={name}
        keywords={refined}
        videos={videos}
        ytApiKey={process.env.NEXT_PUBLIC_YT_API_KEY as string}
      />
      <BackHome
        label="トップに戻る"
        floating
        offsetRight={20}
        offsetBottom={24}
      />
    </>
  );
}

/* ---------- ユーティリティ ---------- */

function ui(children: React.ReactNode) {
  return <div style={{ padding: "1rem", lineHeight: 1.8 }}>{children}</div>;
}

function getOne(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}
