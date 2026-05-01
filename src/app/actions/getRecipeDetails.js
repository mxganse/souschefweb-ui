"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getRecipeDetails(recipeId) {
  if (!recipeId) return { recipeId, instructions_markdown: "", ingredients: [] };

  const supabase = createSupabaseServerClient();

  const [{ data: recipe, error: recipeError }, { data: ingredientRows, error: ingredientError }] =
    await Promise.all([
      supabase
        .from("recipes")
        .select("id,instructions_markdown")
        .eq("id", recipeId)
        .maybeSingle(),
      supabase
        .from("ingredients")
        .select("raw_text")
        .eq("recipe_id", recipeId)
        .order("raw_text", { ascending: true }),
    ]);

  if (recipeError || ingredientError) {
    return {
      recipeId,
      instructions_markdown: "",
      ingredients: [],
      error: recipeError?.message ?? ingredientError?.message ?? "Failed to load recipe details",
    };
  }

  return {
    recipeId,
    instructions_markdown: recipe?.instructions_markdown ?? "",
    ingredients: (ingredientRows ?? []).map((r) => r.raw_text).filter(Boolean),
    error: null,
  };
}

