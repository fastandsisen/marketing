export function buildSearchUrl(
  q: string,
  engine: "google" | "youtube" | "bing" = "google"
) {
  const encoded = encodeURIComponent(q);
  switch (engine) {
    case "youtube":
      return `https://www.youtube.com/results?search_query=${encoded}`;
    case "bing":
      return `https://www.bing.com/search?q=${encoded}`;
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}
