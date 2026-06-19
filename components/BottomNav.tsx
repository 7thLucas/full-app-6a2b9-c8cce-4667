"use client";

import Link from "next/link";

export type NavTab = "feed" | "map" | "snap" | "dogedex" | "you";

interface BottomNavProps {
  active: NavTab;
}

interface TabDef {
  key: Exclude<NavTab, "snap">;
  href: string;
  label: string;
  icon: React.ReactNode;
}

function Icon({ d, filled }: { d: string; filled?: boolean }) {
  return (
    <svg
      className="w-6 h-6"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const FEED_D =
  "M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5";
const MAP_D =
  "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z";
const DEX_D =
  "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25";
const YOU_D =
  "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z";

export default function BottomNav({ active }: BottomNavProps) {
  const left: TabDef[] = [
    { key: "feed", href: "/", label: "Feed", icon: <Icon d={FEED_D} filled={active === "feed"} /> },
    { key: "map", href: "/map", label: "Map", icon: <Icon d={MAP_D} filled={active === "map"} /> },
  ];
  const right: TabDef[] = [
    { key: "dogedex", href: "/dogedex", label: "Dogedex", icon: <Icon d={DEX_D} filled={active === "dogedex"} /> },
    { key: "you", href: "/you", label: "You", icon: <Icon d={YOU_D} filled={active === "you"} /> },
  ];

  const tab = (t: TabDef) => (
    <Link
      key={t.key}
      href={t.href}
      className={`flex flex-col items-center gap-0.5 py-1.5 px-2 pressable ${
        active === t.key ? "text-ink" : "text-ink-3"
      }`}
    >
      {t.icon}
      <span className={`text-[0.62rem] font-bold ${active === t.key ? "text-ink" : "text-ink-3"}`}>
        {t.label}
      </span>
    </Link>
  );

  return (
    <nav className="bottom-nav">
      <div className="grid grid-cols-5 items-end px-2 pt-1.5 pb-2">
        {tab(left[0])}
        {tab(left[1])}

        {/* Raised center Snap action. */}
        <div className="flex justify-center">
          <Link href="/snap" className="relative -mt-7 flex flex-col items-center pressable">
            <span
              className={`w-16 h-16 rounded-full grid place-items-center sticker ${
                active === "snap" ? "bg-ball" : "bg-ball"
              }`}
              style={{ boxShadow: "0 12px 24px -8px oklch(0.86 0.18 128 / 0.7)" }}
            >
              <svg className="w-8 h-8 text-ballink" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </span>
            <span className="text-[0.62rem] font-bold text-ballink mt-0.5">Snap</span>
          </Link>
        </div>

        {tab(right[0])}
        {tab(right[1])}
      </div>
    </nav>
  );
}
