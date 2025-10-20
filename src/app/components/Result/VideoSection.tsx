type SimpleVideo = {
  title: string;
  id: string;
  /** Search/Videos API の snippet.liveBroadcastContent をそのまま入れる */
  liveBroadcastContent?: "live" | "upcoming" | "none";
};

export default function VideoSection({ videos }: { videos: SimpleVideo[] }) {
  if (!videos?.length) return null;

  // ★ live / upcoming を除外
  const filtered = videos.filter(
    (v) => (v.liveBroadcastContent ?? "none") === "none"
  );

  if (filtered.length === 0) return null;

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3 style={{ margin: "0 0 .5rem 0", color: "#1b2a4a" }}>
        🎬 人気動画トップ5
      </h3>

      <div className="card" style={{ padding: "12px 16px" }}>
        <style>{`
          .video-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
          @media (min-width: 640px) { .video-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (min-width: 1024px) { .video-grid { grid-template-columns: repeat(5, 1fr); } }
          .yt { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(27,42,74,.08); }
          .yt > iframe { width: 100%; height: 100%; border: 0; }
        `}</style>

        <div className="video-grid">
          {filtered.slice(0, 5).map((v) => (
            <div className="yt" key={v.id}>
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
