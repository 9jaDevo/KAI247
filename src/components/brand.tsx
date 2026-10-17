import Link from "next/link";
import Image from "next/image";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="KAI247 AI home"
    >
      <Image
        className="brand-image"
        src="/brand/logo.png"
        alt="KAI247 AI"
        width={196}
        height={53}
        loading="eager"
      />
    </Link>
  );
}
