// scripts/seed-reference.js
// Run: node scripts/seed-reference.js

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local')
const envLines = fs.readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const eqIdx = line.indexOf('=')
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && !key.startsWith('#')) process.env[key] = val
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const standards = [

  // ── BOH Basics ─────────────────────────────────────────────────────────────

  {
    category: 'BOH Basics',
    title: 'Sanitation',
    sort_order: 1,
    content_markdown: `## Sanitation

We prioritize the health and safety of our customers and staff. Proper sanitation practices are the foundation of a clean and hygienic kitchen environment.

- **Handwashing:** Wash thoroughly with soap and warm water before and after handling food, using the restroom, or touching any surfaces.
- **Surface & Equipment Sanitation:** All food contact surfaces, equipment, and utensils must be cleaned and sanitized regularly to prevent cross-contamination.
- **Personal Hygiene:** Wear clean uniforms and avoid touching your face while working.`,
  },

  {
    category: 'BOH Basics',
    title: 'FIFO (First In, First Out)',
    sort_order: 2,
    content_markdown: `## FIFO — First In, First Out

To minimize food waste and ensure the freshness of our ingredients, we follow the FIFO method.

- Older food items are used or sold before newer ones.
- All ingredients are labeled with the date of receipt and use-by date.
- Storage areas are organized to facilitate easy access to older stock.
- Incorporate ingredients nearing their expiration date into daily specials to reduce waste and maximize quality.`,
  },

  {
    category: 'BOH Basics',
    title: 'Mise en Place',
    sort_order: 3,
    content_markdown: `## Mise en Place

*"Everything in its place"* — a fundamental principle of kitchen operations.

Before service begins, all ingredients are prepped and organized to ensure a smooth and efficient cooking process:

- Chop vegetables, portion proteins, and measure out spices.
- Set up each workstation with the necessary tools and ingredients arranged in a logical order.
- Completing mise en place diligently minimizes downtime during service and maintains the high standards of quality our customers expect.`,
  },

  {
    category: 'BOH Basics',
    title: 'Teamwork and Communication',
    sort_order: 4,
    content_markdown: `## Teamwork and Communication

Teamwork and communication are essential components of our success. We foster a collaborative environment where every member of the team plays a crucial role.

- Clear communication is encouraged at all times.
- All staff members are empowered to ask questions and seek assistance when needed.
- Tasks are delegated thoughtfully, taking into account each individual's strengths and preferences.
- Working together seamlessly and supporting one another is how we deliver exceptional dining experiences.`,
  },

  // ── Recipe Scaling ─────────────────────────────────────────────────────────

  {
    category: 'Recipe Scaling',
    title: 'How to Scale a Recipe',
    sort_order: 1,
    content_markdown: `## How to Scale a Recipe

Scaling a recipe based on its yield involves adjusting the quantities of ingredients proportionally to achieve the desired number of servings.

### Steps to Scale a Recipe

1. **Determine the Original Yield** — Identify how many servings the original recipe makes.
2. **Determine the Desired Yield** — Decide how many servings you want to make.
3. **Calculate the Scaling Factor** — Divide the desired yield by the original yield.
4. **Adjust Each Ingredient** — Multiply the original quantity of each ingredient by the scaling factor.

### Example

Original yield: 4 servings → Desired yield: 10 servings

**Scaling Factor = 10 ÷ 4 = 2.5**

| Ingredient | Original | Scaled (×2.5) |
|---|---|---|
| Flour | 2 cups | 5 cups |
| Salt | 1 tsp | 2.5 tsp |

### Notes

- **Precision:** Be precise with measurements, especially in baking — small changes can significantly affect the outcome.
- **Non-linear Scaling:** Some recipes do not scale linearly. This includes types of pepper flake, **hydrocolloids**, and **yeasts** — adjust carefully and test.
- **Equipment:** When scaling up or down, consider the size and type of cooking equipment, as this can impact cooking times and results.`,
  },

  // ── Thickening ─────────────────────────────────────────────────────────────

  {
    category: 'Thickening',
    title: 'Hydrocolloid Reference Guide',
    sort_order: 1,
    content_markdown: `## Hydrocolloid Reference Guide

These agents are commonly used in modern culinary gastronomy to achieve various textures, stabilizations, and thickening effects.

### Xanthan Gum
Derived from fermented corn sugar. Powerful thickening agent and stabilizer. Adds viscosity to liquids, creates stable emulsions, and prevents ingredient separation.

### Guar Gum
Extracted from the guar bean. Particularly useful in gluten-free baking — mimics the properties of gluten, providing elasticity and structure to doughs and batters.

### Ultratex 8
A modified tapioca starch treated to withstand higher temperatures and retain thickening properties in acidic environments. Thickens sauces, soups, and preparations **without heating**.

### Agar Agar
Derived from seaweed. Vegetarian alternative to gelatin. Sets at room temperature and forms a firm, brittle gel — ideal for gels, jellies, and firm textures in both desserts and savory dishes.

### Gellan Gum
Microbial polysaccharide. Creates a wide range of textures from soft and elastic to firm and brittle, depending on concentration and combination with other ingredients.

### Gelatin
Protein derived from collagen (animal connective tissues). Widely used as a gelling agent, stabilizer, and thickener. When dissolved in hot liquid and cooled, forms a smooth, creamy gel. Used in puddings, marshmallows, gummy confections, aspics, and terrines.

### Iota Carrageenan
Hydrocolloid extracted from red seaweed. Forms soft, elastic gels when combined with calcium salts. Excellent water-binding properties. Used in dairy and dessert applications — ice creams, custards, mousses.

### Kappa Carrageenan
Also derived from red seaweed. Forms firm, brittle gels when combined with potassium salts. Used in products requiring firmer texture — jellies, jams, fruit gels. Also a stabilizer in dairy products such as chocolate milk and yogurt.`,
  },

  {
    category: 'Thickening',
    title: 'Thickening Chart',
    sort_order: 2,
    content_markdown: `## Thickening Chart

| Preparation | Agent | Percentage | Notes |
|---|---|---|---|
| Pickling Liquid | Ultratex 8 | 3–4% | — |
| Guar Roux | Xanthan + Guar | 1.2% + 0.8% | 1000g H₂O : 12g xanthan + 8g guar. 100g of this roux thickens 1000g to nappe. |
| Pot de Crème | Iota Carrageenan | 0.25% | Full boil required |
| Marmalade / Jam | Ultratex 8 | 5% | — |
| Jus | Ultratex 8 | 2% | e.g. brown butter consommé |
| Fluid Gel | Agar Agar | 1.2% | Full boil required |
| Fluid Gel | Gellan | 1.2% | Full boil required |`,
  },

  // ── Delta-T Cooking ────────────────────────────────────────────────────────

  {
    category: 'Delta-T Cooking',
    title: 'Why Delta Cook?',
    sort_order: 1,
    content_markdown: `## Why Delta Cook?

Delta cooking refers to sous-vide cooking where the bath temperature is set *above* the target core temperature, creating a temperature differential (delta). With few exceptions, this applies to cuts of animal proteins — beef steaks, pork chops, fish filets, etc. — that do not require additional holding time for tenderizing or core-level pasteurization.

### Benefits

**Speed**
The last 2°C approaching your target core temperature always takes the longest. By increasing the water temperature 2°C over your desired core temperature, you can shorten cook time by **30–50%** depending on the thermal conductivity of the product.

**Textural Contrast**
Cooking to equilibrium is the benchmark of sous-vide — foolproof and produces great results. However, some foods like salmon filets are more texturally pleasing when the texture varies from exterior to core. The ability to control not only temperature but also texture is a major benefit of delta cooking.

**Exterior Pasteurization**
We recommend pre-searing food to pasteurize the exterior prior to sous-vide cooking. When that is not done, you may opt to blanch the product in a high-temperature bath prior to cooking in a core-temperature bath, or cook exclusively in a high-delta bath and remove before reaching target core temperature.`,
  },

  {
    category: 'Delta-T Cooking',
    title: 'Delta-T Theory: Methods',
    sort_order: 2,
    content_markdown: `## Delta-T Theory: Methods

### No Delta — 62°C bath → 62°C core
Cook in a 62°C bath until the core temperature reaches equilibrium with the bath (62°C). This is the original and most common method of sous-vide cooking — highly reliable and repeatable. The core cannot exceed the bath temperature, and the result is an extremely uniform texture throughout the meat grain.

**Drawback:** Takes far longer than cooking with a 2–4°C temperature delta.

---

### Low Temperature Delta — 66°C bath → 62°C core *(Preferred)*
Cook in a 66°C bath until the core temperature reaches 62°C, then remove from the bath. **This is our preferred method** for cooking animal proteins to a target core temperature that does not require additional holding time for tenderizing or pasteurization. Very effective at reducing cook time. Reliable when the cook is present to either turn the bath temperature down once the core is reached (for hot holding) or remove the food entirely.

- Recommended for portions greater than 1 inch in thickness.
- Thermometer should trigger an alarm when the product is 0.5°C from the target core.

**Drawback:** If left unattended, the food will continue to cook past the desired core temperature until it reaches equilibrium with the bath.

---

### High Temperature Delta — 83°C bath → 52°C pull → ~62°C carryover
Cook in an 83°C bath until the core reaches 52°C, then remove and rest on a wire rack as carryover cooking brings the final core to approximately 62.4°C. We use this method for animal proteins that have **not been pre-seared** for surface pasteurization, and for proteins that benefit from textural contrast — such as buttery salmon filets.

- Yields a visual and textural result closer to traditional high-heat cooking methods.
- Results may vary slightly (a little under or overcooked) but are far more controlled than grilling, broiling, or pan roasting.
- Recommended for portions greater than 1 inch in thickness.

**Drawback:** Slightly unpredictable. If left unattended, food will continue to cook past desired core temperature.`,
  },

  // ── Sous-Vide ──────────────────────────────────────────────────────────────

  {
    category: 'Sous-Vide',
    title: 'Sous-Vide Time and Temperatures',
    sort_order: 1,
    content_markdown: `## Sous-Vide Time and Temperatures

| Preparation | Temp | Time | Notes |
|---|---|---|---|
| Sweetbreads | 60–70°C | 1 hr | — |
| Pork Sausage | 140°F | 45 min | — |
| Coulotte | 125°F | 6 hr | — |
| Snails | 70°C | 1 hr | — |
| Short Rib | 65°C | 48 hr | — |
| Chicken Breast | 62°C | 1 hr | — |
| Chicken Sausage | 62°C | 30 min | — |
| Hollandaise | 149°F | 30 min | — |
| Duck / Chx Leg Confit | 165°F | 18 hr | — |
| Duck Wing Confit | 165°F | 12 hr | — |
| Lamb | 130°F | — | — |
| Pork Belly | 158°F | 18 hr | — |`,
  },

  // ── Combi-Oven ─────────────────────────────────────────────────────────────

  {
    category: 'Combi-Oven',
    title: 'Combi-Oven Time and Temperatures',
    sort_order: 1,
    content_markdown: `## Combi-Oven Time and Temperatures

| Preparation | Oven Temp | Thermo / Time | Notes |
|---|---|---|---|
| Lamb Roulade | 145°F | 130°F | Full Steam |
| Chicken Roulade | 165°F | 150°F | Full Steam |
| Coulotte | 200°F | 120°F | Dry / 100% |
| Duck Breast | 200°F | 120°F | Dry / 100% |
| Sweet Potatoes | 275°F | 210°F | 80% Moisture |
| Sunchokes | 275°F | 210°F | 80% Moisture |
| Artichokes | 213°F | 7 min | Full Steam |
| Saffron Fingerlings | 213°F | 17 min | Full Steam |
| Endive | 213°F | 7 min | Full Steam |
| Rosti Potatoes | 170°F | 90 min | Full Steam — until fork tender |
| Frittata | 213°F | 12 min | Full Steam — until set |
| Hard Boiled Egg (cold start) | 213°F | 15 min | Full Steam |
| Six Minute Egg (cold start) | 213°F | 7 min | Full Steam |`,
  },

  // ── Portioning ─────────────────────────────────────────────────────────────

  {
    category: 'Portioning',
    title: 'Portioning Specifications',
    sort_order: 1,
    content_markdown: `## Portioning Specifications

| Preparation | Service | Portion |
|---|---|---|
| Short Rib / Beef | Dinner | 6 oz |
| Rohan Duck Breast | Dinner | Whole |
| Rohan Duck Breast | Tasting | Half |
| Fish Filet | Dinner | 6 oz |
| Tuna | All | 5 oz |
| Smoked Salmon | Brunch | 2 oz |
| Short Rib | Brunch | 5 oz |
| Merguez Patty | Brunch | 4 oz |
| Sliced Ham | Brunch | 2 oz |
| Pork Belly | Brunch | 5 oz |`,
  },
]

async function seed() {
  console.log(`Seeding ${standards.length} reference entries…`)

  const { data, error } = await supabase
    .from('culinary_standards')
    .upsert(standards, { onConflict: 'category,title', ignoreDuplicates: false })
    .select('category, title')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Seeded ${data.length} records:`)
  data.forEach(r => console.log(`  [${r.category}] ${r.title}`))
}

seed()
