import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { postAction } from "@/app/lib/postAction";
import { SubmitButton } from "@/app/components/SubmitButton"; // ← 追加

export default function PostPage() {
  return (
    <>
      <main
        style={{
          minHeight: "70dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: "#ffffff", // ほんのり背景色
        }}
      >
        <section style={{ width: "100%", maxWidth: 640, textAlign: "center" }}>
          <div
            style={{
              marginBottom: "1.25rem",
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: ".02em",
              color: "#1b2a4a",
            }}
          >
            AI Keyword Search
          </div>

          {/* Server Action を使うので method/encType は指定しない */}
          <form action={postAction} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".75rem",
                width: "100%",
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="キーワードを入力"
                aria-label="検索キーワード"
                autoFocus
                autoComplete="off"
                className="search-input"
                style={{
                  flex: 1,
                  height: 48,
                  padding: "0 1rem",
                  borderRadius: 9999,
                  border: "1px solid #c9d1e6",
                  outline: "none",
                  fontSize: "1rem",
                  background: "#ffffff",
                  color: "#1b2a4a",
                  boxShadow: "0 1px 2px rgba(27,42,74,0.06)",
                  transition: "box-shadow .15s ease, border-color .15s ease",
                }}
              />

              {/* ここがクライアントのボタン */}
              <SubmitButton />
            </div>

            <p
              style={{
                color: "#4b5b86",
                fontSize: ".9rem",
                marginTop: ".75rem",
              }}
            >
              Enterキーでも検索できます
            </p>
          </form>
        </section>
      </main>

      {/* サーバーのままCSS擬似クラスで色を少しだけ演出 */}
      <style>{`
        .search-input:focus {
          border-color: #94b4ff;
          box-shadow: 0 1px 6px rgba(35,99,255,.24);
        }
        .search-input::placeholder {
          color: #7a8bb5;
        }
      `}</style>
    </>
  );
}
