import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="KAI247 AI home"
    >
      <span className="brand-mark" aria-hidden="true">
        k<span>·</span>
      </span>
      <span>
        KAI247<span className="brand-ai"> AI</span>
      </span>
    </Link>
  );
}
