import { STOP_WORDS } from "@/app/lib/stopWords";

// 必要なら STOP_WORDS に汎用語を少し追加（例）
const EXTRA_STOPS = new Set([
  "amp",
  "ver",
  "www",
  "part",
  "part1",
  "part2",
  "part3",
  "pv",
  "mv",
  "op",
  "ed",
  "tv",
  "official",
  "clip",
  "video",
  "shorts",
  "english",
  "japan",
  "jp",
  "no",
  "the",
  "day",
  "hot",
  "livecamera",
  "onsen",
]);

// 前処理用の正規表現（事前にコンパイル）
const re = {
  url: /https?:\/\/\S+/g,
  // &amp; &quot; &#12345; 等
  htmlEntity: /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g,
  // 全角カッコ・句読点・一般句読点をスペースへ
  punctJa: /[【】\[\]（）()「」『』、。,.!?:;~…・／/\\|]/g,
  // 絵文字（拡張絵文字集合）
  emoji: /\p{Extended_Pictographic}/gu,
  // ゼロ幅・結合記号など
  zw: /[\u200B-\u200D\uFE0E\uFE0F]/g,
  // よく出る定型語を一括空白化
  boiler: /\b(?:part\d+|ver\d*|season\d+|episode\d+|ep\d+)\b/gi,
  // 末尾の w 連打
  tailW: /w{2,}$/i,
};

// カタカナ・長音・小書き仮名集合
const KATAKANA = /[\u30A1-\u30FA\u30FC\u30FD\u30FE]/; // ァ〜ヺ・ー・ヽヾ
const SMALL_KANA = /[ァィゥェォャュョッヮ]/;

export function countWords(name: string, titles: string[]) {
  const freq: Record<string, number> = {};

  // name の正規化（NFKC + lower）
  const nameNorm = name.normalize("NFKC").toLowerCase();

  for (const raw of titles) {
    // --- 前処理 ---
    let s = raw
      .normalize("NFKC")
      .replace(re.url, " ")
      .replace(re.htmlEntity, " ") // amp等の除去
      .replace(re.emoji, " ")
      .replace(re.zw, "")
      .replace(re.boiler, " ")
      .replace(re.punctJa, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!s) continue;

    // --- トークン化 ---
    // 1) カタカナ連続（長音含む）  2) CJK（漢字/ひらがな）2文字以上  3) 英数2文字以上
    const tokens = [
      ...s.matchAll(
        /(?:[ァ-ヶー]{2,})|(?:[\p{Script=Han}\p{Script=Hiragana}]{2,})|(?:[A-Za-z][A-Za-z0-9]{1,})/gu
      ),
    ].map((m) => m[0].toLowerCase());

    for (let t of tokens) {
      // 末尾の w 連打を削る
      t = t.replace(re.tailW, "");

      // 前後のハイフン・長音のみの欠片除外
      if (/^[-ー]+$/.test(t)) continue;

      // 小文字化＋NFKCは済み

      // --- ヒューリスティック ---
      // 数字だけは除外
      if (/^\d+$/.test(t)) continue;

      // 名前（name）を含む語を除外（部分一致）
      if (nameNorm && t.includes(nameNorm)) continue;

      // StopWords（大文字小文字揃え済み）
      if (STOP_WORDS.has(t) || EXTRA_STOPS.has(t)) continue;

      // 英語：2文字以下除外
      if (/^[a-z]+$/.test(t) && t.length < 3) continue;

      // カタカナ：欠片対策（長音含みで短すぎるものを除外）
      const isKatakana = /^[ァ-ヶー]+$/.test(t);
      if (isKatakana) {
        // 小書き仮名のみ/主体が小書きなら除外
        if (SMALL_KANA.test(t[0]) || SMALL_KANA.test(t[t.length - 1])) continue;
        // 最小長3に
        if (t.length < 3) continue;
        // 長音含みで長さ<4は崩れとして除外（例： "ーハ" など）
        if (t.includes("ー") && t.length < 4) continue;
      }

      // 連続同一文字の比率が高い（ノイズ）→除外
      if (/(.)\1{2,}/.test(t)) continue;

      // --- カウント ---
      freq[t] = (freq[t] ?? 0) + 1;
    }
  }
  console.log(freq);
  return freq;
}
