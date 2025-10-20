"use client";

import { useState } from "react";

type Props = { id: string; title: string };

export default function LiteYouTube({ id, title }: Props) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div style={{ position: "relative", paddingTop: "56.25%" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          loading="eager"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            borderRadius: 12,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      aria-label={`${title} を再生`}
      style={{
        display: "block",
        width: "100%",
        aspectRatio: "16 / 9",
        backgroundImage: `url(${thumb})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: 0,
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(27,42,74,0.12)",
      }}
    >
      {/* プレイボタン風の装飾（CSSのみ） */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.35))",
          borderRadius: 12,
        }}
      >
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: "9999px",
            background: "rgba(255,255,255,.92)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,.25)",
          }}
        >
          <span
            style={{
              marginLeft: 4,
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "16px solid #1a3ae6",
              display: "inline-block",
            }}
          />
        </span>
      </span>
    </button>
  );
}
