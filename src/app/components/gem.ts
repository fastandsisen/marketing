// components/gem.ts
export async function filterWithGemini(words: string[]): Promise<string[]> {
  const key = process.env.GEM_API_KEY;
  const top20 = (words ?? [])
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!key) return top20.slice(0, 10);
  if (top20.length === 0) return [];

  const url =
    `https://generativelanguage.googleapis.com/` +
    `v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;

  const prompt =
    `次の単語から、文脈的に適切な10語のみをJSON配列で返してください。なお、ひらがな、カタカナ、ローマ字の違いだけで内容が同一である場合はそのうちの1つでよい` +
    `JSON配列のみを返すこと（説明文やコードブロックは禁止）。\n` +
    `単語: ${top20.join(", ")}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) return top20.slice(0, 10);

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const parsed = parseJsonArray(text);
    return parsed.length ? parsed.slice(0, 10) : top20.slice(0, 10);
  } catch {
    return top20.slice(0, 10);
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
