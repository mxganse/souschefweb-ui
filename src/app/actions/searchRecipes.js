"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeQuery(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function uniqById(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    if (!r?.id) continue;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

export async function searchRecipes(prevState, formData) {
  const query = normalizeQuery(formData?.get("q"));
  const supabase = createSupabaseServerClient();

  // Empty query => show recent recipes
  if (!query) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id,title,category,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    return {
      query: "",
      results: data ?? [],
      error: error?.message ?? null,
    };
  }

  const pattern = `%${query}%`;

  const [{ data: recipeMatches, error: recipesError }, { data: ingredientRows, error: ingredientsError }] =
    await Promise.all([
      supabase
        .from("recipes")
        .select("id,title,category,created_at")
        .or(
          `title.ilike.${pattern},category.ilike.${pattern},instructions_markdown.ilike.${pattern}`
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("ingredients")
        .select("recipe_id")
        .ilike("raw_text", pattern)
        .limit(250),
    ]);

  if (recipesError || ingredientsError) {
    return {
      query,
      results: [],
      error: recipesError?.message ?? ingredientsError?.message ?? "Search failed",
    };
  }

  const recipeIdsFromIngredients = Array.from(
    new Set((ingredientRows ?? []).map((r) => r.recipe_id).filter(Boolean))
  );

  let ingredientRecipeMatches = [];
  if (recipeIdsFromIngredients.length > 0) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id,title,category,created_at")
      .in("id", recipeIdsFromIngredients)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { query, results: [], error: error.message };
    }
    ingredientRecipeMatches = data ?? [];
  }

  const results = uniqById([...(recipeMatches ?? []), ...ingredientRecipeMatches]).slice(0, 100);

  return { query, results, error: null };
}

