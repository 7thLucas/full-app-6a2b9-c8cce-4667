"use client";

import Link from "next/link";

interface BottomNavProps {
  active: "home" | "snap" | "map";
}

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-4 py-2">
        {/* Home / Collection */}
        <Link href="/" className="flex flex-col items-center gap-0.5 py-2 px-4">
          <svg
            className={`w-6 h-6 ${active === "home" ? "text-doge-yellow" : "text-white/40"}`}
            fill={active === "home" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active === "home" ? 0 : 1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span
            className={`text-xs font-medium ${active === "home" ? "text-doge-yellow" : "text-white/40"}`}
          >
            Dogedex
          </span>
        </Link>

        {/* Snap FAB */}
        <Link href="/snap" className="relative -mt-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              active === "snap"
                ? "bg-doge-yellow"
                : "bg-doge-yellow/90 hover:bg-doge-yellow"
            }`}
          >
            <svg
              className="w-7 h-7 text-doge-dark"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-doge-yellow whitespace-nowrap">
            Snap
          </span>
        </Link>

        {/* Map */}
        <Link href="/map" className="flex flex-col items-center gap-0.5 py-2 px-4">
          <svg
            className={`w-6 h-6 ${active === "map" ? "text-doge-yellow" : "text-white/40"}`}
            fill={active === "map" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active === "map" ? 0 : 1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
            />
          </svg>
          <span
            className={`text-xs font-medium ${active === "map" ? "text-doge-yellow" : "text-white/40"}`}
          >
            Map
          </span>
        </Link>
      </div>
    </nav>
  );
}
