import Link from "next/link";
import styles from "./BackHome.module.css";

type BackHomeProps = {
  href?: string;
  label?: string;
  align?: "left" | "center" | "right";
  showIcon?: boolean;
  /** true = 常にフル幅 / "mobile" = モバイル時のみフル幅 */
  fullWidth?: boolean | "mobile";
};

const justify = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

export default function BackHome({
  href = "/",
  label = "フォームに戻る",
  align = "left",
  showIcon = true,
  fullWidth,
}: BackHomeProps) {
  const wrapStyle = fullWidth
    ? { justifyContent: "stretch" as const }
    : { justifyContent: justify[align] };

  // ボタン用クラスを条件で合成
  const buttonClass = [
    styles.button,
    fullWidth === true ? styles.full : "",
    fullWidth === "mobile" ? styles.fullMobile : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrap} style={wrapStyle}>
      <Link href={href} className={buttonClass} aria-label={label}>
        {showIcon && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={styles.icon}
            focusable="false"
          >
            <path
              d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
              fill="currentColor"
            />
          </svg>
        )}
        <span className={styles.label}>{label}</span>
      </Link>
    </div>
  );
}
