const fs = require('fs')
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

// McGee data from "On Cooking" technical culinary reference
const mcgeeEntries = [
  // ─── PROTEINS - MEAT ───────────────────────────────────────────────────────
  {
    category: 'Proteins - Meat',
    title: 'Beef Coagulation & Denaturation',
    sort_order: 10,
    content: `## Beef Coagulation & Denaturation

### Myosin Initial Coagulation
- Temperature: 120°F (50°C)
- Observable change: Proteins begin to unfold; meat develops a white opacity
- Impact: First visible textural change during cooking

### Myoglobin Denaturation
- Temperature: 140°F (60°C)
- Observable change: Red color turns pink; meat begins to release juices
- Impact: Transition from rare to medium doneness

| Protein | Temperature | Change |
|---------|-------------|--------|
| Myosin | 120°F / 50°C | White opacity appears |
| Myoglobin | 140°F / 60°C | Pink; juices release |
`,
  },
  {
    category: 'Proteins - Meat',
    title: 'Beef Collagen Gelatinization',
    sort_order: 11,
    content: `## Beef Collagen Gelatinization

### Collagen → Gelatin Conversion
- Temperature: 160°F (71°C)
- Observable change: Connective tissue starts shrinking significantly; breakdown into gelatin begins
- Culinary impact: This is why braising and slow cooking create tender, moist meat with rich mouthfeel
- Note: Collagen breakdown is time-dependent; longer cooking at lower temperatures is most efficient

| Stage | Temperature | Texture Impact |
|-------|-------------|----------------|
| Begin | 160°F / 71°C | Collagen shrinks, gelatin forms |
| Extended | 185-200°F+ | Full collagen dissolution |
`,
  },

  // ─── PROTEINS - POULTRY ───────────────────────────────────────────────────
  {
    category: 'Proteins - Poultry',
    title: 'Chicken Breast Optimal Juiciness',
    sort_order: 20,
    content: `## Chicken Breast Optimal Juiciness

### Target Doneness Zone
- Temperature: 150°F (65°C)
- Advantages:
  - Pasteurization achieved via time-temperature curve
  - Proteins are set but not tough
  - Maximum juice retention for tender, succulent meat
- Method: Sous-vide or careful oven/pan cooking to 150°F internal temp, rest before serving

### Protein Behavior
- Below 150°F: Still translucent at center; risk of undercooked texture
- At 150°F: Safely cooked; optimum juiciness
- Above 160°F: Proteins contract further; increasing water loss
`,
  },

  // ─── PROTEINS - FISH ───────────────────────────────────────────────────────
  {
    category: 'Proteins - Fish',
    title: 'Lean Fish Flaking & Set',
    sort_order: 30,
    content: `## Lean Fish Flaking & Set

### Species: Cod, Snapper, Halibut
- Temperature: 130°F (55°C)
- Observable change: Muscle fibers separate (flaking); connective tissue is very thin compared to land animals
- Why lower temp: Fish have minimal collagen, so protein denaturation alone sets the flesh

### Cooking Notes
- Fish cook rapidly because muscle structure is delicate
- Carryover cooking significant: Remove at 125-128°F for 130°F at table
- Overcooking turns fish mushy and dry (collagen-to-gelatin conversion adds liquid, but excessive heat drives it out)

| Fish Type | Target Temp | Method |
|-----------|-------------|--------|
| Cod | 130°F / 55°C | Pan-sear, poach |
| Snapper | 130°F / 55°C | Whole roast, steam |
`,
  },

  // ─── PROTEINS - EGGS ───────────────────────────────────────────────────────
  {
    category: 'Proteins - Eggs',
    title: 'Egg White Protein Coagulation',
    sort_order: 40,
    content: `## Egg White Protein Coagulation

### Two-Stage Setting
- **Ovotransferrin Initial Set**: 140°F (60°C)
  - First protein to set
  - Produces a soft, jelly-like white
  - Gives very soft-boiled texture

- **Ovalbumin Firm Set**: 180°F (82°C)
  - Most abundant egg protein
  - Gives structural firmness
  - Classic hard-boiled stage

| Protein | Temperature | Texture |
|---------|-------------|---------|
| Ovotransferrin | 140°F / 60°C | Soft, jelly-like |
| Ovalbumin | 180°F / 82°C | Fully firm |
`,
  },
  {
    category: 'Proteins - Eggs',
    title: 'Egg Yolk Coagulation',
    sort_order: 41,
    content: `## Egg Yolk Coagulation

### Yolk Set Point
- Temperature: 149°F (65°C)
- Observable change: Yolk thickens and sets into a creamy paste
- Culinary use:
  - Soft-boiled (runny center): 62-64°C
  - Jammy yolk: 65-67°C
  - Fully set: 71-72°C

### Precision Cooking
For exact yolk doneness, use sous-vide or precise temperature water bath to target temperature for 12-15 minutes.
`,
  },

  // ─── VEGETABLES ────────────────────────────────────────────────────────────
  {
    category: 'Vegetables',
    title: 'Plant Cell Wall Softening (Hemicellulose)',
    sort_order: 50,
    content: `## Plant Cell Wall Softening

### Hemicellulose Breakdown
- Temperature: 183°F (84°C)
- Observable changes:
  - Hemicellulose breaks down
  - Cell walls lose structural integrity
  - Vegetables visibly soften
  - Starch granules gelatinize

### Practical Implications
- Vegetables under 83°C remain firm and bright (al dente)
- Above 83°C: Progressive softening, color dulling
- Extended cooking: Cell walls collapse further; nutrients leach; color fades (chlorophyll breaks down)

| Temp | Texture | Color | Use |
|------|---------|-------|-----|
| <183°F | Firm | Bright | Salad, quick sauté |
| 183-195°F | Tender | Dull | Cooked vegetable |
| >195°F | Soft | Faded | Braise, puree |
`,
  },

  // ─── STARCHES ──────────────────────────────────────────────────────────────
  {
    category: 'Starches',
    title: 'Cornstarch Gelatinization',
    sort_order: 60,
    content: `## Cornstarch Gelatinization

### Starch Granule Behavior
- Temperature: 144°F (62°C) to full thickness at 203°F (95°C)
- At 144°F (62°C):
  - Starch granules swell and absorb water
  - Mixture begins to thicken
- At 203°F (95°C):
  - Full gelatinization
  - Maximum viscosity
  - Granules burst; starch fully hydrated

### Slurry Tips
- Prevent lumping: Mix starch with cold liquid first
- Add slurry slowly while whisking
- Bring to boil for full thickening power
- Overcooking at high heat: Granules rupture; sauce thins paradoxically
`,
  },
  {
    category: 'Starches',
    title: 'Potato Starch Gelatinization',
    sort_order: 61,
    content: `## Potato Starch Gelatinization

### Lower Gelatinization Temperature
- Temperature: 136°F (58°C)
- Gelatinizes 8°F lower than corn starch
- Advantage: Thickens at lower temps; useful for delicate sauces
- Risk: **Prone to shearing if overmixed**
  - Excessive stirring breaks swollen granules
  - Causes viscosity loss even while still hot
  - Use gentle folding motion, not vigorous whisking

### Best Practices
- Add liquid very gradually to prevent lumping
- Stir gently and infrequently once thickened
- Serve immediately; reheating causes further granule breakdown
`,
  },

  // ─── SUGARS ────────────────────────────────────────────────────────────────
  {
    category: 'Sugars',
    title: 'Sugar Stages: Soft Ball to Hard Crack',
    sort_order: 70,
    content: `## Sugar Stages: Confectionary

### Soft Ball Stage
- Temperature: 235°F (113°C)
- Concentration: ~85% sugar
- Uses: Fudges, fondants, smooth confections
- Test: Forms soft ball in cold water; flattens when removed

### Hard Crack Stage
- Temperature: 300°F (149°C)
- Concentration: ~99% sugar
- Uses: Hard candies, brittle, lollipops
- Test: Forms hard, brittle threads in cold water

| Stage | Temp | Concentration | Use |
|-------|------|----------------|-----|
| Soft Ball | 235°F / 113°C | 85% sugar | Fudge, fondant |
| Hard Crack | 300°F / 149°C | 99% sugar | Hard candy, brittle |
`,
  },
  {
    category: 'Sugars',
    title: 'Sugar Caramelization & Browning',
    sort_order: 71,
    content: `## Sugar Caramelization & Browning

### Maillard & Caramel Reactions
- Temperature: 338°F (170°C) and above
- What happens:
  - Sugar molecules break down via thermal decomposition
  - Complex nutty, bitter, and roasted flavors develop
  - Color progresses: pale yellow → amber → dark brown → black char

### Flavor Development
- Light amber (320-330°F): Sweet, subtle caramel flavor
- Medium amber (338-350°F): Nutty, balance of sweetness & bitterness
- Dark amber (350-365°F): Deep caramel, pronounced bitterness
- Black (>365°F): Burned, acrid, unusable

### Practical Use
- Sauce bases: Deglaze pan with liquid immediately upon reaching desired color
- Pulled sugar: Work quickly; color sets immediately upon cooling
- Caramel decoration: Use at 338°F for optimal flavor without acridness
`,
  },

  // ─── FATS ──────────────────────────────────────────────────────────────────
  {
    category: 'Fats',
    title: 'Extra Virgin Olive Oil Smoke Point',
    sort_order: 80,
    content: `## Extra Virgin Olive Oil Smoke Point

### Thermal Breakdown
- Temperature: 375°F (191°C)
- What happens:
  - Acids in the oil begin to break down
  - Flavor becomes acrid and bitter
  - Smoke point reached; oil becomes unsuitable for fine cooking

### Culinary Use Guidelines
- Below 350°F (175°C): Safe for medium-heat cooking; flavor preserved
- 350-375°F (175-191°C): Use sparingly; flavor compromises
- Above 375°F (191°C): Switch to neutral oils (canola, vegetable, peanut)

**Better use:** Reserve extra virgin for dressings, finishing, and low-temp cooking. Use refined olive oil (higher smoke point ~465°F) for actual pan-searing.
`,
  },
  {
    category: 'Fats',
    title: 'Clarified Butter (Ghee) Smoke Point',
    sort_order: 81,
    content: `## Clarified Butter (Ghee) Smoke Point

### Clarification Removes Water & Milk Solids
- Smoke point: 485°F (252°C)
- Comparison to whole butter: +140°F higher
- Reason: Milk solids burn at ~350°F; removing them raises smoke point dramatically

### Advantages
- Extremely high heat stability for searing, deep-frying, sautéing
- Neutral flavor (milk solids removed)
- Longer shelf life than whole butter (no water to spoil)
- Can be reused several times before discarding

### Making Clarified Butter
1. Melt whole butter slowly over low heat
2. Let settle 10-15 minutes
3. Skim foam (milk solids) from top
4. Pour clear golden liquid into container, leaving milky solids at bottom
5. Store in cool place or refrigerate

| Fat | Smoke Point | Best Use |
|-----|-------------|----------|
| Whole Butter | 350°F / 177°C | Sauces, low-temp |
| Clarified Butter | 485°F / 252°C | Searing, frying |
| Extra Virgin Olive | 375°F / 191°C | Finishing, dressing |
`,
  },
]

async function seed() {
  console.log('Upserting', mcgeeEntries.length, 'McGee reference entries…')

  const { error } = await supabase.from('culinary_standards').upsert(
    mcgeeEntries.map(entry => ({
      category: entry.category,
      title: entry.title,
      content_markdown: entry.content,
      sort_order: entry.sort_order,
    })),
    {
      onConflict: 'category,title',
    }
  )

  if (error) {
    console.error('Upsert failed:', error)
    process.exit(1)
  }

  console.log('✓ Upserted', mcgeeEntries.length, 'records:')
  mcgeeEntries.forEach(e => console.log(`  [${e.category}] ${e.title}`))
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
