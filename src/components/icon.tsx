import type { SVGProps } from "react";

const paths = {
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18",
  car: "M3 17V9l3-5h12l3 5v8M3 10h18M6 14h2m8 0h2M5 17v3m14-3v3M3 17h18",
  sparkles:
    "m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2M20 2v4m-2-2h4M4 18v4m-2-2h4",
  people:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a7 7 0 0 1 14 0v3H2m15-17a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 6h-3",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  calendar: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2m-8 3h2",
  document: "M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6",
  check: "m5 12 4 4L19 6",
  bell: "M6 16h12l-2-3V9a4 4 0 0 0-8 0v4zM10 20h4",
  settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
  plus: "M12 5v14M5 12h14",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  shield: "m12 3 8 3v6c0 4-8 9-8 9s-8-5-8-9V6zM8 12l3 3 5-6",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v5l3 2",
  logout: "M10 4H4v16h6M9 12h12m-4-4 4 4-4 4",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
