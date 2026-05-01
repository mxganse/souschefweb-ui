"use client";

import { useMemo } from "react";

const ACCENT = "#D35400";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
}

export default function RecipeCard({ recipe, onOpen }) {
  const subtitle = useMemo(() => recipe.category || "Uncategorized", [recipe.category]);
  return (
    <article className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className={[
          "relative w-full overflow-hidden rounded-2xl border text-left backdrop-blur",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_24px_60px_-40px_rgba(0,0,0,0.85)]",
          "transition duration-300 focus:outline-none focus:ring-2 focus:ring-white/20",
          "border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.03] hover:border-white/[0.12]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div
            className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${ACCENT}33, transparent 65%)` }}
          />
        </div>

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.16] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.10] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-white/55">{subtitle}</p>
              <h3 className="mt-1 line-clamp-2 text-balance text-lg font-semibold leading-snug tracking-tight text-white">
                {recipe.title || "Untitled"}
              </h3>
            </div>

            <div className="shrink-0 text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-black/20 px-3 py-1 text-xs font-medium text-white/70">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                  aria-hidden="true"
                />
                Open
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-white/45">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-[2px] rounded-full"
                  style={{ backgroundColor: `${ACCENT}CC` }}
                  aria-hidden="true"
                />
                Ticket
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <span className="font-mono">#{String(recipe.id).slice(0, 8)}</span>
            </div>
            <div className="text-xs font-medium text-white/55">{formatDate(recipe.created_at)}</div>
          </div>
        </div>

        <div className="relative border-t border-dashed border-white/[0.10] px-5 py-3">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>Archived</span>
            <span className="font-medium tracking-wide" style={{ color: `${ACCENT}CC` }}>
              SOUSCHEF
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute left-0 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-[rgba(14,17,23,0.92)]" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-7 w-7 translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-[rgba(14,17,23,0.92)]" />
      </button>

      <div className="sr-only">Open recipe</div>
    </article>
  );
}

