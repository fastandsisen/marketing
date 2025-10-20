import { buildSearchUrl } from "@/app/lib/buildSearchUrl";

export default function RankingSection({
  name,
  refined,
}: {
  name: string;
  refined: string[];
}) {
  if (!refined?.length) {
    return <p style={{ color: "gray" }}>抽出できませんでした</p>;
  }

  return (
    <section style={{ margin: "1rem 0" }}>
      <h3
        style={{
          margin: "0 0 .5rem 0",
          color: "#1b2a4a",
          letterSpacing: ".02em",
        }}
      >
        🔎 人気関連ワード Top 20
      </h3>

      <style>{`
        @media (min-width: 900px) {
          .rank-grid { grid-template-columns: 1fr 1fr; justify-content: center; }
        }
        .card {
          background: #ffffff; border: 1px solid #e6ebf5; border-radius: 16px;
          box-shadow: 0 4px 16px rgba(27,42,74,0.05); overflow: hidden;
        }
        .card-header {
          padding: .75rem 1rem; background: linear-gradient(180deg, #f6f8ff, #eef3ff);
          border-bottom: 1px solid #e6ebf5; font-weight: 600; color: #223057;
        }
        .table { width: 100%; border-collapse: collapse; font-size: 1.5rem; }
        .table th, .table td {
          text-align: left; border-bottom: 1px solid #edf1f7; padding: 10px 12px; vertical-align: middle;
        }
        .table tr:hover td { background: #fafbff; }
        .rank-badge {
          display:inline-block; min-width: 2.5em; text-align:center; font-variant-numeric: tabular-nums;
          border-radius: 9999px; background: #eef3ff; color:#2b43a7; padding: 2px 10px; border: 1px solid #dbe5ff;
        }
      `}</style>

      <div
        className="rank-grid"
        style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr" }}
      >
        {/* 左：1〜10位 */}
        <article className="card">
          <div className="card-header">1〜10位</div>
          <table className="table" aria-label="人気関連ワード 上位1から10">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>順位</th>
                <th>ワード</th>
              </tr>
            </thead>
            <tbody>
              {refined.slice(0, 10).map((w, i) => (
                <tr key={`L-${i}`}>
                  <td>
                    <span className="rank-badge">{i + 1}位</span>
                  </td>
                  <td>
                    <a
                      href={buildSearchUrl(`${name} ${w}`, "google")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`"${w}" をWeb検索`}
                    >
                      {w}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        {/* 右：11〜20位 */}
        <article className="card">
          <div className="card-header">11〜20位</div>
          <table className="table" aria-label="人気関連ワード 11から20">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>順位</th>
                <th>ワード</th>
              </tr>
            </thead>
            <tbody>
              {refined.slice(10, 20).map((w, i) => (
                <tr key={`R-${i}`}>
                  <td>
                    <span className="rank-badge">{i + 11}位</span>
                  </td>
                  <td>
                    <a
                      href={buildSearchUrl(`${name} ${w}`, "google")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`"${w}" をWeb検索`}
                    >
                      {w}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
