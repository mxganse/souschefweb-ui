"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { getRecipeDetails } from "./actions/getRecipeDetails";

const ACCENT = "#D35400";

function clampText(s) {
  if (typeof s !== "string") return "";
  return s.trim();
}

export default function RecipeDialog({ open, recipe, onClose }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const recipeId = recipe?.id ?? null;
  const hasLoaded = Boolean(details && details.recipeId && details.recipeId === recipeId);

  // Lock scroll + allow Esc to close.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Fetch details on open (server-side action).
  useEffect(() => {
    if (!open) return;
    if (!recipeId) return;
    if (hasLoaded) return;

    let cancelled = false;
    setIsLoading(true);
    startTransition(() => {
      getRecipeDetails(recipeId)
        .then((payload) => {
          if (cancelled) return;
          setDetails(payload);
        })
        .finally(() => {
          if (cancelled) return;
          setIsLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [open, recipeId, hasLoaded]);

  // Reset cached details when opening a different recipe.
  useEffect(() => {
    if (!open) return;
    if (!recipeId) return;
    if (details?.recipeId && details.recipeId !== recipeId) setDetails(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, open]);

  const ingredients = useMemo(() => details?.ingredients ?? [], [details]);
  const instructions = useMemo(() => clampText(details?.instructions_markdown ?? ""), [details]);
  const detailsError = details?.error ?? null;

  if (!open || !recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title ? `${recipe.title} recipe` : "Recipe details"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />

      <div className="relative mx-auto flex h-full max-w-5xl items-center px-4 py-6 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.10] bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_40px_120px_-60px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${ACCENT}33, transparent 65%)` }}
            />
          </div>

          <div className="relative border-b border-white/[0.08] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/45">
                  {recipe.category || "UNCATEGORIZED"}
                </p>
                <h2 className="mt-1 text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {recipe.title || "Untitled"}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.10] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `${ACCENT}CC` }}
                  aria-hidden="true"
                />
                Close
              </button>
            </div>
          </div>

          <div className="relative max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
            {isLoading ? (
              <div className="text-sm text-white/65">Loading recipe…</div>
            ) : detailsError ? (
              <div className="text-sm text-white/65">
                <span className="font-semibold text-white/75">Couldn’t load details.</span>{" "}
                <span className="text-white/55">{detailsError}</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                <aside className="md:col-span-1">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <p className="text-xs font-semibold tracking-wide text-white/60">
                      Ingredients
                    </p>
                    <ul className="mt-3 space-y-2">
                      {ingredients.length ? (
                        ingredients.map((t, idx) => (
                          <li key={`${recipeId}-ing-${idx}`} className="text-sm leading-6 text-white/78">
                            <span
                              className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                              style={{ backgroundColor: `${ACCENT}CC` }}
                              aria-hidden="true"
                            />
                            <span className="align-middle">{t}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/55">No ingredients found.</li>
                      )}
                    </ul>
                  </div>
                </aside>

                <section className="md:col-span-2">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <p className="text-xs font-semibold tracking-wide text-white/60">
                      Instructions
                    </p>
                    <div className="mt-3">
                      <pre className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                        {instructions || "No instructions found."}
                      </pre>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="relative border-t border-dashed border-white/[0.10] px-5 py-3 sm:px-6">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span className="font-mono">#{String(recipeId).slice(0, 8)}</span>
              <span className="font-medium tracking-wide" style={{ color: `${ACCENT}CC` }}>
                SOUSCHEF
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute left-0 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-[rgba(14,17,23,0.92)]" />
          <div className="pointer-events-none absolute right-0 top-1/2 h-7 w-7 translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-[rgba(14,17,23,0.92)]" />
        </div>
      </div>
    </div>
  );
}

