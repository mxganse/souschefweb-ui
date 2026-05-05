/**
 * Test script to verify recipe enrichment logic
 * Fetches real data from Supabase and tests the enrichment
 */
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://qxbjhgejzuxeinrcravj.supabase.co';
const ANON_KEY = 'sb_publishable_LiOXyQIr7-xgAEFwfqsVEA_ESlCmbO7';

async function query(table, select = '*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=1000`;
  const res = await fetch(url, {
    headers: { apikey: ANON_KEY },
  });
  if (!res.ok) {
    throw new Error(`${table} query failed: ${res.status}`);
  }
  return res.json();
}

async function test() {
  console.log('Fetching data from Supabase...');

  const [recipes, mealTypes, dietaryFlags, cookingStyles] = await Promise.all([
    query('recipes', 'id,title'),
    query('recipe_meal_types', 'recipe_id,meal_type'),
    query('recipe_dietary_flags', 'recipe_id,dietary_flag'),
    query('recipe_cooking_styles', 'recipe_id,cooking_style'),
  ]);

  console.log(`\nFetched:
  - ${recipes.length} recipes
  - ${mealTypes.length} meal_type entries
  - ${dietaryFlags.length} dietary_flag entries
  - ${cookingStyles.length} cooking_style entries`);

  // Build lookup maps (same logic as recipes/page.js)
  const mealTypeMap = {};
  for (const row of mealTypes) {
    if (!mealTypeMap[row.recipe_id]) mealTypeMap[row.recipe_id] = { values: [], overrides: {} };
    mealTypeMap[row.recipe_id].values.push(row.meal_type);
  }

  const dietaryMap = {};
  for (const row of dietaryFlags) {
    if (!dietaryMap[row.recipe_id]) dietaryMap[row.recipe_id] = [];
    dietaryMap[row.recipe_id].push(row.dietary_flag);
  }

  const cookingMap = {};
  for (const row of cookingStyles) {
    if (!cookingMap[row.recipe_id]) cookingMap[row.recipe_id] = [];
    cookingMap[row.recipe_id].push(row.cooking_style);
  }

  // Enrich recipes (same logic as recipes/page.js)
  const enriched = recipes.map(r => ({
    ...r,
    meal_types: mealTypeMap[r.id]?.values ?? [],
    dietary_flags: dietaryMap[r.id] ?? [],
    cooking_styles: cookingMap[r.id] ?? [],
  }));

  // Statistics
  const withMealTypes = enriched.filter(r => r.meal_types.length > 0).length;
  const withDietaryFlags = enriched.filter(r => r.dietary_flags.length > 0).length;
  const withCookingStyles = enriched.filter(r => r.cooking_styles.length > 0).length;

  console.log(`\nEnrichment results:
  - ${withMealTypes}/${enriched.length} recipes have meal_types
  - ${withDietaryFlags}/${enriched.length} recipes have dietary_flags
  - ${withCookingStyles}/${enriched.length} recipes have cooking_styles`);

  // Test filtering
  console.log('\n--- Filter Tests ---');

  // Test 1: Filter by dinner
  const dinnerRecipes = enriched.filter(r => r.meal_types.includes('dinner'));
  console.log(`\nFilter: mealTypes=['dinner']`);
  console.log(`  Results: ${dinnerRecipes.length} recipes`);
  if (dinnerRecipes.length > 0) {
    console.log(`  First: "${dinnerRecipes[0].title}" => meal_types: ${dinnerRecipes[0].meal_types.join(', ')}`);
  }

  // Test 2: Filter by vegetarian
  const vegetarianRecipes = enriched.filter(r => r.dietary_flags.includes('vegetarian'));
  console.log(`\nFilter: dietaryFlags=['vegetarian']`);
  console.log(`  Results: ${vegetarianRecipes.length} recipes`);
  if (vegetarianRecipes.length > 0) {
    console.log(`  First: "${vegetarianRecipes[0].title}" => dietary_flags: ${vegetarianRecipes[0].dietary_flags.join(', ')}`);
  }

  // Test 3: Filter by roasting
  const roastingRecipes = enriched.filter(r => r.cooking_styles.includes('roasting'));
  console.log(`\nFilter: cookingStyles=['roasting']`);
  console.log(`  Results: ${roastingRecipes.length} recipes`);
  if (roastingRecipes.length > 0) {
    console.log(`  First: "${roastingRecipes[0].title}" => cooking_styles: ${roastingRecipes[0].cooking_styles.join(', ')}`);
  }

  // Test 4: Combined filter (dinner AND vegetarian)
  const dinnerVegRecipes = enriched.filter(r =>
    r.meal_types.includes('dinner') && r.dietary_flags.includes('vegetarian')
  );
  console.log(`\nFilter: mealTypes=['dinner'] AND dietaryFlags=['vegetarian']`);
  console.log(`  Results: ${dinnerVegRecipes.length} recipes`);
  if (dinnerVegRecipes.length > 0) {
    console.log(`  First: "${dinnerVegRecipes[0].title}"`);
  }

  // Show some sample enriched recipes
  console.log('\n--- Sample Enriched Recipes ---');
  enriched.slice(0, 3).forEach(r => {
    console.log(`\n"${r.title}"`);
    console.log(`  meal_types: ${r.meal_types.join(', ') || '(none)'}`);
    console.log(`  dietary_flags: ${r.dietary_flags.join(', ') || '(none)'}`);
    console.log(`  cooking_styles: ${r.cooking_styles.join(', ') || '(none)'}`);
  });
}

test().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
