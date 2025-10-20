"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{
        height: 44,
        padding: "0 1rem",
        borderRadius: 9999,
        border: "1px solid #c9d1e6",
        background: pending ? "#cfd7ff" : "#e8ecff", // やさしい青
        color: "#1b2a4a",
        fontSize: ".95rem",
        cursor: pending ? "not-allowed" : "pointer",
        transition: "background .2s ease, transform .05s ease",
      }}
      onMouseDown={(e) => {
        // hover/activeはクライアント側ならOK（任意）
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      {pending ? "検索中…" : "検索"}
    </button>
  );
}
