export const dynamic = "force-dynamic"; // キャッシュせず常に最新結果を取得
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { filterWithGemini } from "@/app/lib/gem";
import BackHome from "@/app/components/BackHome";
import RankingSection from "@/app/components/Result/RankingSection";
import VideoSection from "@/app/components/Result/VideoSection";
import { countWords } from "@/app/lib/countWords";
import JapanVsForeignPie from "@/app/components/Result/JapanVsForeignPie";
import PromoBridge from "@/app/components/Result/PromoBridge";

type SP = Record<string, string | string[] | undefined>;

type SimpleVideo = { title: string; id: string }; // ← 追加

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

  // ===== YouTube APIで最大100件（50件×2ページ想定だが、ここでは1ページ）取得 =====
  const titles: string[] = [];
  const videos: SimpleVideo[] = []; // ← 追加：リンク用に保持
  let nextPageToken: string | undefined;

  for (let page = 0; page < 2; page++) {
    const qs = new URLSearchParams({
      key: API_KEY,
      part: "snippet",
      q: name, // 部分一致検索
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
          <pre>クオータがなくなりました</pre>
          <BackHome />
        </>
      );
    }

    const json = await res.json();
    for (const item of json.items ?? []) {
      const lbc = item?.snippet?.liveBroadcastContent;
      if (lbc && lbc !== "none") continue;
      const t = item?.snippet?.title as string | undefined;
      const id = item?.id?.videoId as string | undefined;
      if (t) titles.push(t);
      if (t && id) videos.push({ title: t, id }); // ← 追加保存（リンク用）
    }

    nextPageToken = json.nextPageToken;
    if (!nextPageToken) break;
  }

  // ===== タイトルから単語頻度集計 =====
  const freq = countWords(name, titles);
  const ranked = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([token, count], i) => ({ rank: i + 1, token, count }));

  // ... 50語の ranked を作成済みとする
  const top50 = ranked.map((r) => r.token).slice(0, 50);

  // Geminiで絞り込み（外部関数）
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
      <BackHome label="トップに戻る" align="center" fullWidth="mobile" />
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
