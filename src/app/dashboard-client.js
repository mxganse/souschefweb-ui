"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { searchRecipes } from "./actions/searchRecipes";
import RecipeCard from "./recipe-card";
import RecipeDialog from "./recipe-dialog";

const BG = "#0E1117";

export default function DashboardClient({ initialRecipes }) {
  const searchId = useId();
  const inputRef = useRef(null);

  const initialState = useMemo(
    () => ({ query: "", results: initialRecipes ?? [], error: null }),
    [initialRecipes]
  );

  const [state, action, isPending] = useActionState(searchRecipes, initialState);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(state?.query ?? "");
  }, [state?.query]);

  const [openRecipeId, setOpenRecipeId] = useState(null);

  // Submit on small debounce while typing (keeps UI "dynamic" without requiring Enter).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handle = setTimeout(() => {
      const fd = new FormData();
      fd.set("q", el.value);
      startTransition(() => {
        action(fd);
      });
    }, 220);
    return () => clearTimeout(handle);
  }, [query, action]);

  // Collapse expanded card when results change (keeps the grid stable).
  useEffect(() => {
    setOpenRecipeId(null);
  }, [state?.results]);

  const results = state?.results ?? [];
  const openRecipe = useMemo(
    () => results.find((r) => r.id === openRecipeId) ?? null,
    [results, openRecipeId]
  );

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: BG,
        backgroundImage:
          "radial-gradient(900px 500px at 20% 0%, rgba(211,84,0,0.14), transparent 55%), radial-gradient(900px 600px at 85% 10%, rgba(255,255,255,0.06), transparent 60%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 -mx-4 px-4 pb-5 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/45">
                  SOUSCHEFWEB
                </p>
                <h1 className="text-pretty text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Recipe Dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/55">
                  Secure server-side search across titles, chefs, instructions, and ingredients.
                </p>
              </div>

              <div className="w-full md:max-w-xl">
                <label
                  htmlFor={searchId}
                  className="mb-2 block text-xs font-medium tracking-wide text-white/60"
                >
                  Search recipes
                </label>

                <form action={action} className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white/45"
                      aria-hidden="true"
                    >
                      <path
                        d="M10.5 18.5C14.9183 18.5 18.5 14.9183 18.5 10.5C18.5 6.08172 14.9183 2.5 10.5 2.5C6.08172 2.5 2.5 6.08172 2.5 10.5C2.5 14.9183 6.08172 18.5 10.5 18.5Z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      />
                      <path
                        d="M21.5 21.5L16.95 16.95"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <input
                    id={searchId}
                    name="q"
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Title, chef, ingredients, notes…"
                    className="h-14 w-full rounded-2xl border border-white/[0.10] bg-white/[0.06] pl-11 pr-28 text-base text-white placeholder:text-white/35 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_18px_50px_-40px_rgba(0,0,0,0.9)] backdrop-blur outline-none transition focus:border-white/[0.18] focus:bg-white/[0.07] focus:ring-2 focus:ring-white/15"
                    autoComplete="off"
                    inputMode="search"
                  />

                  <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-black/20 px-3 text-xs font-semibold text-white/70 transition hover:bg-black/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        Clear
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.08] px-3 text-xs font-semibold text-white/75 transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      {isPending ? "Searching…" : "Search"}
                    </button>
                  </div>
                </form>

                <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                  <span>
                    Results:{" "}
                    <span className="font-semibold text-white/70">{results.length}</span>
                  </span>
                  {state?.error ? (
                    <span className="text-xs font-medium text-white/60">
                      Error: <span className="text-white/70">{state.error}</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline">
                      Background: <span className="font-mono text-white/60">{BG}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
        </header>

        <main className="mt-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onOpen={() => setOpenRecipeId(r.id)}
              />
            ))}
          </section>

          {!isPending && results.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center text-sm text-white/60">
              No recipes match{" "}
              <span className="font-semibold text-white/80">
                {query ? `“${query}”` : "your search"}
              </span>
              .
            </div>
          ) : null}
        </main>
      </div>

      <RecipeDialog
        open={Boolean(openRecipeId)}
        recipe={openRecipe}
        onClose={() => setOpenRecipeId(null)}
      />
    </div>
  );
}

