// scripts/seed-reference-modernist.js
// Run: node scripts/seed-reference-modernist.js

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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

  // ── Gels ───────────────────────────────────────────────────────────────────

  {
    category: 'Gels',
    title: 'Fluid Gels — Overview',
    sort_order: 1,
    content_markdown: `## Fluid Gels — Overview

Fluid gels are gels that have been mechanically disrupted during or after setting to break their continuous network into microscopic gel particles suspended in the liquid phase. Unlike set gels, which hold a fixed shape at rest, fluid gels exhibit shear-thinning (pseudoplastic) behavior: they flow under applied force and recover viscosity when shear is removed. This makes them useful for sauces, dressings, and plated liquids that hold position on a plate but flow smoothly when disturbed.

### How They Differ from Set Gels

- **Set gels** form a continuous, elastic network that holds shape indefinitely at appropriate temperatures
- **Fluid gels** are set gels whose network has been sheared into particles — they behave as a suspension, not a solid
- Fluid gels have a **yield stress**: below a threshold force they behave like a solid; above it they flow
- Texture ranges from barely thickened (low concentration, vigorous shear) to near-solid (high concentration, gentle shear)

### Shear-Thinning Behavior

- Viscosity **decreases** as shear rate increases — the gel particles align and slide past one another
- On removal of shear, particles re-entangle and viscosity **recovers**, often within seconds
- Shear can be applied during setting (hot shear: blending while cooling) or after setting (cold shear: processing a set slab)
- Hot-shear method generally produces smaller, more uniform particles and a smoother mouthfeel
- Particle size governs final texture: finer particles → silkier, more fluid result; coarser particles → more body and opacity

### Key Agents Used for Fluid Gels

- **Agar** — most common; sets firm, shears easily, heat-stable fluid gel
- **Low-acyl gellan** — produces very firm, brittle gel; fluid gel is exceptionally smooth and pourable
- **Kappa carrageenan** — firm, slightly elastic gel; fluid gel has good coating properties
- **Iota carrageenan** — softer, more elastic gel; fluid gel is thicker and less pourable
- **Gelatin** — can be fluid-gelled but is temperature-sensitive; melts above ~35°C`,
  },

  {
    category: 'Gels',
    title: 'Fluid Gel Ratios',
    sort_order: 2,
    content_markdown: `## Fluid Gel Ratios

Concentration, shear intensity, and shear timing are the three variables that govern the final texture of a fluid gel. The table below gives working starting-point ratios by weight of liquid; adjust within the range based on desired viscosity and the natural viscosity of the base liquid. All agents must be fully hydrated before shearing begins.

### Ratio Reference Table

| Agent | % by Weight | Shear Conditions | Texture Notes |
|---|---|---|---|
| Agar | 0.5% | Hot shear (blend at ~70–80°C while cooling) | Light, very pourable; minimal body |
| Agar | 0.8–1.0% | Hot shear or cold shear of set slab | Medium body; holds trail on plate |
| Agar | 1.2–1.5% | Cold shear of set slab | Thick, spoonable; opaque |
| Low-acyl gellan | 0.2–0.3% | Hot shear (blend above 70°C while cooling); calcium ions accelerate set | Very fluid, glossy, glass-like |
| Low-acyl gellan | 0.4–0.5% | Hot shear; note ion content of liquid affects set strength | Moderately thick; highly stable |
| Kappa carrageenan | 0.3–0.5% | Hot shear above 60°C while cooling | Smooth, medium-viscosity; slight elasticity |
| Kappa carrageenan | 0.6–0.8% | Hot shear or cold shear | Thick, coating; synergistic with locust bean gum |
| Iota carrageenan | 0.5–1.0% | Hot shear above 50°C | Soft, thixotropic; recovers viscosity quickly |

### Process Notes

- **Hot shear**: disperse agent in cold liquid, heat to full hydration temperature, then blend continuously while cooling through the setting range
- **Cold shear**: allow gel to set fully, then process in blender or pass through fine tamis; add reserved liquid to adjust consistency
- Dissolved salts (Ca²⁺, K⁺) significantly strengthen low-acyl gellan and kappa carrageenan gels — account for mineral content of base liquid
- Acid lowers agar and carrageenan gel strength; adjust concentration upward when working below pH 4.5
- Pass finished fluid gel through a fine-mesh sieve to remove any coarse particles that cause graininess on the palate`,
  },

  {
    category: 'Gels',
    title: 'Hot Gels',
    sort_order: 3,
    content_markdown: `## Hot Gels

Hot gels are hydrocolloid systems that gel upon heating and melt upon cooling — the thermoreversible opposite of conventional gels. Methylcellulose is the primary agent used in professional kitchens for this effect. The behavior arises because methylcellulose's hydrophobic methyl groups become less soluble as temperature rises, driving association into a gel network.

### Methylcellulose Behavior

- **Gels when heated** above approximately 50–55°C (exact temperature depends on grade and concentration)
- **Melts when cooled** below approximately 40°C — returns to a viscous liquid
- Gelation is fully reversible and can be cycled repeatedly without degradation
- Hydration must occur cold: disperse powder in a portion of boiling water, then add ice water and refrigerate overnight (4°C) to fully hydrate before use
- Does not gel in dry heat; requires an aqueous system

### Ratio Reference Table

| Grade / Application | % by Weight | Gel Strength | Notes |
|---|---|---|---|
| Standard (MC) | 1.5% | Soft, barely self-supporting when hot | Pourable cold; gels to soft set |
| Standard | 2.0% | Firm, holds shape when hot | Classic hot gel application range |
| High-viscosity grade | 1.5–2.0% | Firmer at equivalent concentration | Check supplier spec for gel temp |

### Technique Notes

- **Hydration protocol**: whisk powder into ⅓ of liquid volume at boiling, stir until dispersed, then add remaining liquid as ice water; refrigerate 8–12 hours
- Always work with a fully hydrated, cold (≤4°C) solution before service; gel forms rapidly once plated into a hot environment
- Can be aerated before service while cold: whip chilled solution to incorporate air, then spoon into hot environment where it sets as a foam-gel
- Not compatible with high salt concentrations, which lower gelation temperature and can cause premature setting
- Syneresis (weeping) increases at concentrations above 2.5%; stay within working range`,
  },

  {
    category: 'Gels',
    title: 'Cold-Set Gels',
    sort_order: 4,
    content_markdown: `## Cold-Set Gels

Cold-set gels are hydrocolloid systems — most commonly gelatin — that are liquid when warm and gel when cooled below their setting temperature. Gelatin's gel strength, melt point, and texture vary significantly with bloom strength (a standardized measure of gel firmness) and concentration. Understanding bloom strength allows precise control over set texture from barely trembling to firm and sliceable.

### Gelatin Bloom Strength

- **Bloom** is measured by the force (in grams) required to depress a standardized plunger 4 mm into a set gel of defined concentration
- Common commercial grades: **100–125 bloom** (soft), **160–180 bloom** (medium, most common), **200–250 bloom** (high, firm)
- Higher bloom = firmer gel at equivalent concentration, or same texture at lower concentration
- Bloom strength affects melt temperature: higher bloom gels melt at slightly higher temperatures (~32–35°C) versus lower bloom (~28–32°C)

### Ratio Reference Table

| Bloom Grade | % by Weight | Set Temp | Melt Temp | Texture at Set |
|---|---|---|---|---|
| 200+ bloom | 0.5–0.8% | ~15–18°C | ~30–32°C | Soft, barely set; pourable when warmed |
| 200+ bloom | 1.0–1.5% | ~18–20°C | ~32–34°C | Soft to medium; sliceable if chilled |
| 180 bloom | 1.5–2.0% | ~16–20°C | ~30–33°C | Medium; standard panna cotta range |
| 180 bloom | 2.5–3.0% | ~18–20°C | ~32–34°C | Firm; can be unmoulded at room temp |
| 100–125 bloom | 2.5–3.5% | ~15–18°C | ~28–30°C | Equivalent firmness to 180 bloom at lower % |

### Technique Notes

- **Bloom gelatin**: soak sheet or powdered gelatin in cold water (5× its weight) for 5–10 minutes before dissolving; prevents lumping
- Dissolve bloomed gelatin in liquid heated to 55–60°C; do not boil — sustained boiling degrades gel strength
- **Proteolytic enzymes** (fresh pineapple, papaya, kiwi, fig, ginger) contain proteases that cleave gelatin and prevent setting; always use pasteurized or heated fruit
- Gelatin is not vegetarian; agar or carrageenan-based formulations can substitute but behave differently
- Gelatin gels held too long above 15°C will weep (syneresis); store set products at 2–4°C
- Salt and sugar both slightly lower set temperature; account for high-sugar or high-salt base liquids by increasing concentration ~0.2–0.3%`,
  },

  {
    category: 'Gels',
    title: 'Agar Gel Techniques',
    sort_order: 5,
    content_markdown: `## Agar Gel Techniques

Agar is a polysaccharide extracted from red algae that forms heat-stable, brittle gels with a distinct melt-set hysteresis: it sets at approximately 32–40°C but does not melt until approximately 85–90°C. This hysteresis makes agar uniquely useful for gels that must remain set at room temperature or during warm plating. Its gel character ranges from tender and translucent at low concentrations to firm and opaque at higher concentrations.

### Hydration and Boil Requirement

- Agar **must reach a full rolling boil** (100°C at sea level) to fully hydrate and activate; insufficient heating produces grainy, weak, or uneven gels
- Disperse agar powder or flakes into cold liquid while stirring to prevent clumping, then bring to a boil
- Maintain boiling for **at least 2 minutes** while stirring to ensure complete hydration
- Flakes require longer cooking than powder; powder is preferred for precision work
- At altitude, extend boiling time to compensate for lower boiling point

### Set and Melt Temperatures

| Parameter | Approximate Range | Notes |
|---|---|---|
| Set temperature | 32–40°C | Sets quickly; work efficiently once temperature drops |
| Melt temperature | 85–90°C | Stable at serving temperatures; survives warm sauces |
| Hysteresis window | ~50°C | Core advantage over gelatin and most other agents |

### Ratio Reference Table

| Application | % by Weight | Texture |
|---|---|---|
| Fluid gel (light) | 0.5% | Very pourable; thin coating |
| Fluid gel (medium) | 0.8–1.0% | Spoonable; holds shape briefly on plate |
| Fluid gel (thick) | 1.2–1.5% | Dense, pasty; bold body |
| Set slab / sheet | 0.5–0.8% | Tender, translucent; cuts cleanly |
| Set slab / sheet | 1.0–1.5% | Firm, slightly opaque; used for noodles, sheets |
| Firm mould | 1.5–2.0% | Brittle; holds intricate shapes |

### Fluid Gel vs. Slab Applications

- **Fluid gel method**: blend continuously (immersion blender or high-speed blender) as liquid cools through the set temperature range; the forming gel network is constantly disrupted into particles; adjust final viscosity with reserved liquid
- **Slab method**: pour hot solution into a flat tray, allow to set undisturbed, then cut, extrude, or process as needed
- **Noodle / sheet technique**: pour a thin layer onto a flat surface (acetate, silicone mat, or chilled marble); peel once set and cut to shape
- Acid weakens agar gels; at pH below 4.5 increase concentration by 0.2–0.5% and confirm full set before service`,
  },

  // ── Spherification ────────────────────────────────────────────────────────

  {
    category: 'Spherification',
    title: 'Spherification — Overview',
    sort_order: 1,
    content_markdown: `## Spherification — Overview

Spherification is a controlled gelation technique in which sodium alginate reacts with calcium ions to form a thin, flexible membrane around a liquid core. The result is a sphere that bursts on the palate, releasing its contents. Two primary methods exist — basic and reverse — each suited to different base liquids and service requirements.

### How the Calcium-Alginate Membrane Forms

- Sodium alginate is a polysaccharide derived from brown seaweed; it remains fluid until it contacts calcium ions
- When an alginate-laden liquid meets a calcium salt bath (basic method), calcium ions cross-link the alginate chains at the surface, forming a gel skin within seconds
- The reaction is self-limiting from the outside in: the membrane thickens over time but the core remains liquid as long as calcium has not fully diffused through
- In reverse spherification, calcium is dissolved in the base liquid and dropped into an alginate bath; the membrane forms from the outside inward, but the calcium-rich interior prevents the gel from ever setting solid

### Basic vs. Reverse — When to Use Each

| Factor | Basic Spherification | Reverse Spherification |
|---|---|---|
| Alginate location | Base liquid | Setting bath |
| Calcium location | Setting bath | Base liquid |
| Time sensitivity | High — membrane thickens, core eventually gels | Low — sphere is stable indefinitely |
| Calcium-rich bases (dairy, juices) | Incompatible without treatment | Compatible |
| Frozen base liquids | Not practical | Possible — thaw in alginate bath |
| pH sensitivity | Fails below ~pH 4 | Less sensitive; some tolerance with buffering |
| Texture at service | Thin, delicate membrane | Slightly thicker, more robust membrane |`,
  },

  {
    category: 'Spherification',
    title: 'Basic Spherification Ratios',
    sort_order: 2,
    content_markdown: `## Basic Spherification Ratios

Basic spherification disperses sodium alginate into the flavored base liquid, which is then dropped into a calcium chloride setting bath. Precise hydration and resting time for the alginate solution are critical to achieving a smooth, lump-free mixture and a consistent membrane.

### Base Liquid (Alginate Solution)

| Agent | % by Weight | Notes |
|---|---|---|
| Sodium alginate | 0.5–1.0% | 0.5% for delicate membranes; 0.75–1.0% for more structural spheres |
| Base liquid | to 100% | Must be low-calcium; blend with immersion blender, rest 30–60 min to degas |
| Xanthan gum (optional) | 0.1–0.2% | Increases viscosity to help spheres hold shape during dropping |

### Setting Bath

| Agent | % by Weight | Notes |
|---|---|---|
| Calcium chloride | 0.5% | Higher concentrations accelerate membrane formation but can impart bitterness |
| Water | to 100% | Use distilled or low-mineral water for consistent results |

### Timing by Format

| Format | Diameter | Setting Time |
|---|---|---|
| Caviar | 4–6 mm | 1–2 minutes |
| Small sphere | 8–12 mm | 2–3 minutes |
| Large sphere | 15–25 mm | 3–4 minutes |

### Rinsing

- Transfer spheres immediately to a clean water rinse bath after setting
- Rinse removes excess calcium chloride, which contributes bitterness and continues cross-linking the membrane
- Hold in plain water or a lightly flavored neutral liquid; do not hold for extended periods or the membrane will continue to thicken
- Serve as close to production as possible`,
  },

  {
    category: 'Spherification',
    title: 'Reverse Spherification Ratios',
    sort_order: 3,
    content_markdown: `## Reverse Spherification Ratios

Reverse spherification places the calcium source inside the base liquid and the sodium alginate in the setting bath. Because the gelling reaction proceeds inward from the membrane surface, the interior never fully sets, and the sphere remains stable indefinitely without a rinse or immediate service. This method is essential for calcium-rich bases and enables make-ahead or frozen applications.

### Base Liquid (Calcium Solution)

| Agent | % by Weight | Notes |
|---|---|---|
| Calcium lactate gluconate | 1.0–2.0% | Preferred — neutral flavor; calcium lactate alone (1.0–1.5%) is acceptable but slightly chalky |
| Base liquid | to 100% | Compatible with dairy, citrus, and other calcium-rich or acidic liquids |
| Xanthan gum (optional) | 0.1–0.3% | Improves shape retention when dropping; use for thin or watery bases |

### Setting Bath

| Agent | % by Weight | Notes |
|---|---|---|
| Sodium alginate | 0.4–0.5% | Hydrate in water with immersion blender; rest minimum 30 min to degas fully |
| Water | to 100% | Distilled or filtered; minerals in tap water can cause premature gelling of bath |

### Key Advantages Over Basic Method

- **No time limit:** Sphere membrane does not continue to thicken; spheres can be held in the alginate bath or a neutral water bath for hours
- **Frozen base possible:** Freeze calcium-laden base into desired shape, then submerge frozen piece in alginate bath; membrane forms as it thaws
- **Calcium-rich and acidic bases:** Dairy, coconut milk, fruit juices with natural calcium — all work without pre-treatment
- **Rinsing optional:** Spheres may be held in water or served directly; no bitterness from calcium chloride

### Setting Time

- Membrane forms within 2–3 minutes for caviar sizes
- Allow 3–5 minutes for larger spheres (15–25 mm) to ensure membrane integrity
- Longer bath times do not harm the sphere — a key operational advantage`,
  },

  {
    category: 'Spherification',
    title: 'Spherification Troubleshooting',
    sort_order: 4,
    content_markdown: `## Spherification Troubleshooting

Spherification failures almost always trace back to three variables: pH of the base liquid, calcium content of the base liquid, and viscosity. Use the table below as a first-pass diagnostic.

### Diagnostic Table

| Problem | Likely Cause | Method Affected | Corrective Action |
|---|---|---|---|
| Membrane fails to form | Base liquid pH below ~4.0; alginate denatures in high-acid environments | Basic | Raise pH with sodium citrate (0.5–1.5%) before adding alginate; target pH 4.5+ |
| Sphere gels solid immediately | Excess free calcium in base liquid reacts with alginate prematurely | Basic | Switch to reverse spherification; or chelate calcium with sodium hexametaphosphate (0.1–0.2%) |
| Uneven membrane or holes | Alginate not fully hydrated; air bubbles in solution | Both | Rest alginate solution 30–60 min after blending; degas under vacuum if available |
| Sphere flattens or tails | Base liquid too thin / low viscosity | Basic | Add xanthan gum 0.1–0.3% to base before adding alginate |
| Bath gels over time | Natural calcium leaching from spheres into alginate bath | Reverse | Replace alginate bath every 45–60 min during service; keep bath cool |
| Bitter or salty off-flavor | Residual calcium chloride not rinsed | Basic | Extend rinse time; use two sequential rinse baths |
| Membrane too thick / chewy | Over-set — too long in setting bath | Basic | Reduce setting time; serve immediately after rinsing |
| Alginate bath lumps | Alginate added to cold water or not dispersed before hydrating | Both | Blend alginate into water with immersion blender; allow full hydration before use |

### Sugar Content and Viscosity

- High Brix liquids (>30°Brix) increase viscosity and can slow membrane formation
- Very high sugar concentrations may require slightly increased alginate percentages (up to 1.0–1.2%) to achieve the same membrane strength
- Test with a small batch when working with liquids above 40°Brix`,
  },

  {
    category: 'Spherification',
    title: 'Caviar & Pearl Sizing',
    sort_order: 5,
    content_markdown: `## Caviar & Pearl Sizing

The size and consistency of spheres is determined primarily by the tool used to dispense the liquid, the drop height, and the viscosity of the base solution. Standardizing the dispensing method is essential for uniform results during service.

### Sizing by Dispensing Tool

| Format | Tool | Diameter | Setting Time (Basic) | Setting Time (Reverse) |
|---|---|---|---|---|
| Caviar | Dropper bottle, pipette, or caviar box | 4–6 mm | 1–2 min | 2–3 min |
| Pearl / small sphere | Syringe (no needle) or squeeze bottle | 8–12 mm | 2–3 min | 3–4 min |
| Large sphere / raviolo | Spoon or ladle, mold | 15–25 mm | 3–4 min | 4–5 min |

### Technique Notes by Format

**Caviar (4–6 mm)**
- Hold dropper 2–5 cm above the bath surface for consistent drop shape
- A caviar box (multi-hole dispensing tool) allows simultaneous production of many pearls
- High viscosity base helps maintain round shape; add xanthan if needed

**Pearl / Small Sphere (8–12 mm)**
- Use a syringe barrel without a needle to dispense controlled volumes
- A slow, consistent squeeze produces rounder spheres than a fast drop
- Allow spheres to settle before moving them in the bath to avoid deformation

**Large Sphere / Raviolo (15–25 mm)**
- Spoon method: fill a large spoon or ladle and lower gently into the bath
- Hemisphere molds filled with base liquid and dipped into bath produce very consistent shapes
- Extended setting time required to form a membrane strong enough to survive handling
- Reverse spherification strongly preferred at this size for membrane stability and service flexibility`,
  },

  // ── Emulsions ─────────────────────────────────────────────────────────────

  {
    category: 'Emulsions',
    title: 'Emulsions — Overview',
    sort_order: 1,
    content_markdown: `## Emulsions — Overview

An emulsion is a dispersion of one liquid phase within another immiscible liquid phase, stabilized by an emulsifier that reduces interfacial tension. The two primary types are oil-in-water (O/W), where oil droplets are suspended in an aqueous continuous phase, and water-in-oil (W/O), where water droplets are suspended in a lipid continuous phase. Stability is governed by droplet size, emulsifier concentration, viscosity of the continuous phase, and electrostatic or steric repulsion between droplets.

### Oil-in-Water vs Water-in-Oil

- **O/W examples:** vinaigrette (temporary), hollandaise, mayonnaise
- **W/O examples:** butter, margarine
- O/W emulsions are generally lighter on the palate; W/O emulsions carry fat-soluble flavor compounds more efficiently
- Dilutes with water (O/W) vs. dilutes with oil (W/O) — a quick field test

### Stability Factors

- **Droplet size:** smaller droplets = greater surface area = more emulsifier needed, but more stable once formed
- **Emulsifier concentration:** must exceed critical micelle concentration (CMC) to form a coherent interfacial film
- **Continuous phase viscosity:** increasing viscosity (e.g., with xanthan or modified starch) slows droplet coalescence
- **Temperature:** heat can denature protein-based emulsifiers; some emulsions invert phase on heating
- **pH:** affects charge on protein emulsifiers; near isoelectric point, emulsification capacity drops sharply

### HLB Scale (Hydrophilic-Lipophilic Balance)

- Scale runs 0–20; higher HLB = more hydrophilic emulsifier
- **HLB 1–6:** W/O emulsifiers (e.g., glycerol monostearate)
- **HLB 8–18:** O/W emulsifiers (e.g., polysorbate 80, soy lecithin ~8)
- Blending two emulsifiers to hit a target HLB is common modernist practice`,
  },

  {
    category: 'Emulsions',
    title: 'Lecithin Emulsification',
    sort_order: 2,
    content_markdown: `## Lecithin Emulsification

Lecithin is a phospholipid complex — sourced commercially from soy or sunflower — that acts as an amphiphilic emulsifier and foaming agent. At low concentrations it produces light oil-in-water emulsions and aerated foams; it does not gel or significantly thicken the base liquid, making it ideal where clean texture is required.

### Soy vs Sunflower Lecithin

- **Soy lecithin:** most widely available; may carry allergen labeling requirements; slight beany off-note at high concentrations
- **Sunflower lecithin:** non-GMO and soy-free; milder flavor; functionally equivalent at the same usage levels
- Both are available in liquid (deoiled) and powder form; powder disperses more easily in cold liquids
- Hydrate in the aqueous phase before combining with oil for best emulsification

### Usage Ratios

| Application | Lecithin % by Weight | Notes |
|---|---|---|
| Air foam / espuma air | 0.5–1.0% | Use immersion blender at surface to incorporate air; works best with aqueous, low-fat bases |
| Light O/W emulsion | 0.5–1.0% | Combine with xanthan 0.1–0.2% for extended stability |
| Vinaigrette stabilization | 0.5–0.75% | Blend lecithin into aqueous phase; add oil gradually |
| Flavored oil dispersion | 0.25–0.5% | For visual droplet effect; not a stable long-term emulsion |

### Application Notes

- Disperse powder lecithin in warm liquid (40–55°C) before adding fat phase
- Over-shearing can collapse foam; use moderate blender speed
- Combine with a hydrocolloid (xanthan, iota carrageenan) to extend foam life beyond 15–20 minutes
- Lecithin alone produces transient foams; it is not a gelling agent and will not set structure`,
  },

  {
    category: 'Emulsions',
    title: 'Modernist Vinaigrette Ratios',
    sort_order: 3,
    content_markdown: `## Modernist Vinaigrette Ratios

A traditional vinaigrette is a temporary emulsion — typically 3:1 oil to acid — that separates within minutes because no emulsifier or thickener is present. Modernist approaches introduce hydrocolloids and emulsifiers into the aqueous phase to produce stable, pourable vinaigrettes that hold emulsion for hours to days without separation.

### Traditional vs Modernist Comparison

| Parameter | Traditional | Modernist (Xanthan + Lecithin) |
|---|---|---|
| Oil:Acid ratio | 3:1 to 4:1 | 3:1 to 4:1 (unchanged) |
| Emulsifier | None or mustard (~1 Tbsp/cup) | Soy/sunflower lecithin 0.5–0.75% |
| Thickener | None | Xanthan gum 0.1–0.2% |
| Stability | Separates in minutes | Stable 6–24+ hours |
| Texture | Thin, watery aqueous phase | Slightly viscous, coating |
| Application method | Whisk or shake | Immersion blender |

### Hydrocolloid Ratios for Vinaigrette

| Agent | % by Weight of Total | Notes |
|---|---|---|
| Xanthan gum | 0.1–0.2% | Disperse in oil phase first to avoid clumping; provides shear-thinning viscosity |
| Soy lecithin (powder) | 0.5–0.75% | Hydrate in aqueous (acid) phase |
| Dijon mustard | 0.5–1.0% | Traditional emulsifier; provides flavor alongside emulsification |
| Iota carrageenan | 0.1–0.15% | Use for gel-set or thicker pourable texture; requires heating to dissolve |

### Technique Notes

- Disperse xanthan in oil before combining phases to prevent hydration lumps
- Blend aqueous phase with lecithin first; stream oil in slowly under high shear
- Xanthan creates pseudoplastic (shear-thinning) behavior: thick at rest, fluid when poured or shaken
- Avoid freezing xanthan-stabilized emulsions; ice crystal formation breaks the network`,
  },

  {
    category: 'Emulsions',
    title: 'Transglutaminase (Meat Glue)',
    sort_order: 4,
    content_markdown: `## Transglutaminase (Meat Glue)

Transglutaminase (TG) is an enzyme that catalyzes the formation of covalent isopeptide bonds between the amino acids glutamine and lysine in protein chains, effectively cross-linking proteins from different pieces of muscle tissue. This allows disparate cuts or different proteins to be bonded into a seamless, structurally unified piece that behaves like a single muscle when cooked.

### Mechanism

- Enzyme is naturally occurring; commercial form is produced via fermentation
- Bonds are irreversible; heat does not re-dissolve the bond (unlike gelatin)
- Requires direct protein-to-protein contact at the bonding surfaces — surfaces must be clean, dry, and pressed firmly together
- Does not work on fat or connective tissue; only on myofibrillar proteins

### Usage Ratios

| Application | TG % by Weight of Protein | Notes |
|---|---|---|
| Muscle-to-muscle bonding | 0.5–1.0% | Standard application; dust or slurry both work |
| Tender, clean bond (thin pieces) | 0.5–0.75% | Lower end sufficient for flush, even surfaces |
| Restructured or mosaic cuts | 1.0% | Higher end for complex assemblies or irregular surfaces |
| Protein noodle / sheet | 0.75–1.0% | Applied to purée or ground protein; set in vacuum bag |

### Application Notes

- **Dry method:** dust TG powder directly on clean, patted-dry protein surface; press surfaces together; vacuum-seal; rest at 1–4°C for 4–12 hours
- **Slurry method:** mix TG with cold water (1:4 ratio by weight) to form a paste; apply with brush or gloved hand; allows more even coverage on irregular surfaces
- Enzyme activity decreases rapidly above 60°C; fully denatured above 75°C — bond is permanent by service temperature
- Calcium and ascorbic acid can accelerate or inhibit activity respectively; avoid acidic marinades prior to application`,
  },

  // ── Foams ─────────────────────────────────────────────────────────────────

  {
    category: 'Foams',
    title: 'Foams — Overview',
    sort_order: 1,
    content_markdown: `## Foams — Overview

A culinary foam is a gas-in-liquid or gas-in-gel dispersion where air or another gas is incorporated into a flavored base that contains a surfactant, gelling agent, or protein sufficient to stabilize the bubble walls. Foams vary widely in texture, persistence, and service temperature, and selecting the correct stabilization system depends on whether the foam must hold at room temperature, survive refrigeration, or be served warm.

### Foam Types

- **Air foam (lecithin foam):** produced with an immersion blender at the liquid surface; ephemeral, 10–20 minute lifespan; light and airy
- **Espuma (ISI whipper foam):** pressurized N₂O charges force gas through liquid base containing a stabilizer; texture ranges from light mousse to dense cream
- **Warm foam:** must use heat-stable stabilizers (methylcellulose, which gels on heating); service temperature 55–70°C
- **Cold foam:** stabilized with cold-setting gels (iota carrageenan, gelatin at low concentration, whipped cream); service temperature 0–10°C
- **Set foam:** gel concentration is high enough that the foam holds a rigid or semi-rigid shape after setting; can be cut or molded

### Stability Considerations

- Bubble coalescence and drainage are the two primary failure modes
- Higher viscosity of the continuous phase slows drainage; hydrocolloids address this
- Smaller bubble size = greater stability; high-shear devices (ISI, immersion blender) produce smaller bubbles than whipping by hand
- Fat content above ~30% can inhibit foam formation in protein-based systems but is necessary for whipped cream
- Alcohol above ~15% destabilizes most protein foams; lecithin foams tolerate higher alcohol content better than egg-white foams`,
  },

  {
    category: 'Foams',
    title: 'Foam Ratios',
    sort_order: 2,
    content_markdown: `## Foam Ratios

Selecting the correct stabilizer and concentration is the critical decision in foam design. Each stabilizer operates through a different mechanism — surfactancy, viscosity increase, or gel network formation — and the appropriate choice depends on service temperature, desired texture, and required hold time.

### Stabilizer Ratio Table

| Stabilizer | % by Weight of Base | Foam Type | Service Temp | Notes |
|---|---|---|---|---|
| Soy/sunflower lecithin | 0.5–1.0% | Air foam | Cold or room temp | Immersion blender method; ephemeral (10–20 min); best with thin, aqueous base |
| Methylcellulose (MC) | 0.5–1.0% | Warm foam | 55–70°C | Gels on heating, melts on cooling (reverse thermal gel); hydrate in ice water first |
| Iota carrageenan | 0.15–0.25% | Stabilized cold foam | 0–15°C | Requires calcium ions to set; elastic, fluid gel texture; shear to foam after setting |
| Gelatin | 0.4–0.6% | Set or cold foam | 0–10°C | Bloom 200 preferred; set in mold or whip before gel point for light cold foam |
| Egg white (fresh or pasteurized) | 5–10% | Protein foam | Cold or warm (below 60°C) | Classic method; combine with sugar for meringue-type stability |
| Xanthan + lecithin | 0.1–0.15% xanthan + 0.5% lecithin | Extended air foam | Cold or room temp | Xanthan increases continuous phase viscosity; doubles foam lifespan vs lecithin alone |
| Heavy cream (35%+ fat) | 30–40% of base | Whipped cream foam | 0–10°C | Fat crystals stabilize bubble walls; over-whipping collapses to butter |

### General Technique Notes

- Hydrate all powder hydrocolloids fully before foaming — undissolved particles destabilize bubbles
- Methylcellulose must be hydrated in cold or ice water and then warmed to activate; reverse of most hydrocolloids
- Iota carrageenan requires heating to 70–80°C to dissolve, then cooling and shearing to create a pourable fluid gel before foaming
- Adjust salt, acid, and sugar in base before foaming — adding them after disrupts foam structure`,
  },

  {
    category: 'Foams',
    title: 'Espuma Technique',
    sort_order: 3,
    content_markdown: `## Espuma Technique

An espuma is a foam produced by charging a liquid or semi-liquid base with N₂O (nitrous oxide) in an ISI whipper or equivalent pressurized siphon. The gas dissolves into the base under pressure and expands rapidly upon dispensing, aerating the liquid into a stable, fine-textured foam. The base composition determines whether the espuma is suited for hot or cold service.

### ISI Whipper Capacity and Charge Ratios

| Canister Size | Base Volume | N₂O Charges |
|---|---|---|
| 0.5 L | 300–350 ml | 1 charge |
| 1.0 L | 600–700 ml | 2 charges |
| 1.0 L (dense/fatty base) | 600–700 ml | 2–3 charges |

### Base Ratios by Foam Style

| Foam Style | Stabilizer | % by Weight | Service Temp | Notes |
|---|---|---|---|---|
| Cold gelatin espuma (light) | Gelatin | 0.4–0.6% | 0–10°C | Dissolve gelatin in warm base; fill canister cold; charge and hold refrigerated |
| Cold gelatin espuma (set) | Gelatin | 0.8–1.2% | 0–10°C | Higher gelatin for mousse-like structure; dispense into mold and set |
| Cream-based cold espuma | Cream (35%+) | 30–50% of base | 0–10°C | Cream acts as both base and stabilizer; add sugar or flavoring to cream base directly |
| Hot espuma (methylcellulose) | Methylcellulose | 0.5–1.0% | 55–70°C | Hydrate MC in ice water; warm to service temp; charge canister warm; hold in bain-marie |
| Fluid savory espuma | Gelatin | 0.3–0.5% | Cold to room temp | Stock or juice base, low-fat; very light foam; best for plating accent |

### Technique Notes

- Always strain base through a fine sieve before filling the canister — particles block the nozzle valve
- Fill canister no more than two-thirds full to allow gas expansion space
- Charge, shake vigorously 8–10 times, then rest 2–3 minutes before dispensing to allow gas to dissolve
- Invert canister fully when dispensing; incomplete inversion dispenses liquid rather than foam
- For hot espumas, pre-warm the canister with hot water before filling; maintain in a 60–65°C bain-marie during service
- Gelatin-based espumas must remain below 25°C or the gel matrix softens and foam collapses
- N₂O is the correct gas for culinary espuma; CO₂ adds carbonation and is appropriate only for sparkling applications`,
  },

  // ── Hydrocolloids (additional entries) ────────────────────────────────────

  {
    category: 'Hydrocolloids',
    title: 'Methylcellulose',
    sort_order: 10,
    content_markdown: `## Methylcellulose

Methylcellulose is a thermally reversible hydrocolloid with a uniquely inverted gelation behavior: it forms a gel when heated and returns to a liquid state upon cooling. This reverse-set property makes it useful for hot-set applications where conventional gels would melt. It is derived from cellulose and requires careful hydration in cold water before use.

### Hydration Protocol

- **Do not** disperse in warm or hot water — the powder will clump and gel prematurely
- Disperse in cold water (ideally 0–4°C or over ice) and allow full hydration before applying heat
- Alternatively, blend dry into fat or oil first, then hydrate in cold liquid
- Full hydration may take 30–60 minutes under refrigeration

### Gelation Behavior

- Begins to gel at approximately **50–55°C**
- Firm gel achieved above **60°C**
- Returns to liquid upon cooling below **40°C**
- Gelation is fully reversible and repeatable

### Usage Ratios

| Application | % by weight | Notes |
|---|---|---|
| Soft hot gel | 1.5% | Tender texture; melts readily on cooling |
| Firm hot gel | 2.0% | Holds shape well when hot; fully fluid when cold |
| Fluid gel base | 1.0–1.5% | Shear while cooling for pourable gel texture |

### Key Properties

- Not gelled by calcium or pH changes — thermally driven only
- Relatively neutral flavor impact
- Compatible with most liquids; high salt or sugar concentrations may shift gelation temperature
- Shear-thinning when in gel state above set temperature`,
  },

  {
    category: 'Hydrocolloids',
    title: 'Sodium Alginate',
    sort_order: 11,
    content_markdown: `## Sodium Alginate

Sodium alginate is an anionic polysaccharide extracted from brown seaweed that gels irreversibly in the presence of calcium ions. It is cold-soluble and produces firm, brittle gels at low concentrations. Its primary modernist applications are spherification (basic and reverse) and the production of gel noodles or sheets.

### Acid Sensitivity

- Sodium alginate is highly sensitive to **low pH environments**
- Solutions below pH 4.0 will cause premature gelation or viscosity loss before calcium contact
- For acidic liquids (citrus, vinegar-based), use **reverse spherification** — calcium in the base, alginate in the bath
- Buffering with sodium citrate can partially stabilize acidic alginate solutions

### Gelation Mechanism

- Gels form upon contact with calcium (Ca²⁺) ions — reaction is **irreversible**
- Setting bath: typically **0.5% calcium chloride** (CaCl₂) by weight in water
- Gel skins form within seconds; thicker membranes require longer bath time

### Usage Ratios

| Application | Alginate % | Calcium Source | Notes |
|---|---|---|---|
| Basic spherification base | 0.5–0.6% | — | Drop into CaCl₂ 0.5% bath |
| Reverse spherification bath | 0.4–0.5% | Calcium lactate gluconate 1.0–1.5% in base | Stable indefinitely in bath |
| Gel noodles / sheets | 0.8–1.0% | Set in CaCl₂ bath | Extrude or sheet; rinse thoroughly |

### Key Properties

- Cold-soluble; no heat required for dissolution
- Gels are thermostable — will not melt at serving temperatures
- Rinse finished spheres in plain water to halt calcium reaction and remove bitterness from CaCl₂
- Excess calcium in the base liquid will cause premature gelation during preparation`,
  },

  {
    category: 'Hydrocolloids',
    title: 'Pectin — LM vs HM',
    sort_order: 12,
    content_markdown: `## Pectin — LM vs HM

Pectin is a structural polysaccharide found in plant cell walls, most commonly extracted from citrus peel or apple pomace. It exists in two functionally distinct forms — high-methoxyl (HM) and low-methoxyl (LM) — each requiring different conditions to set. Understanding the distinction is critical, as using the wrong type for a given application will result in failed gels.

### High-Methoxyl (HM) Pectin

- Requires **sugar concentration above 55% by weight** and **low pH (3.0–3.5)** to gel
- Gelation is driven by hydrogen bonding and hydrophobic interactions — calcium is not required
- Sets on cooling; gel is thermoreversible but has a relatively high melt point
- Typical applications: jams, jellies, glazes with high sugar content
- Adjust pH with citric acid or tartaric acid; measure with pH meter for precision

### Low-Methoxyl (LM) Pectin

- Gels via **ionic crosslinking with calcium ions** — sugar and acid are not required
- Can set at low or zero sugar concentrations — suitable for reduced-sugar or savory applications
- Two subtypes: standard LM (requires added calcium) and amidated LM (more tolerant of calcium variation, softer gel)

### Usage Ratios

| Type | Pectin % by weight | Sugar Required | pH Required | Calcium Required | Notes |
|---|---|---|---|---|---|
| HM Pectin | 1.0–2.0% | 55%+ | 3.0–3.5 | No | Classic jam/jelly; high-Brix glazes |
| LM Pectin | 0.5–1.5% | Optional | 3.5–5.0 | Yes (0.1–0.3% CaCl₂) | Savory gels, low-sugar fruit preparations |
| LM Amidated | 0.5–1.0% | Optional | 3.5–5.5 | Yes (lower tolerance range) | Softer, creamier texture; more forgiving |

### Hydration and Dispersion

- Disperse pectin into sugar (dry blend) before adding to liquid to prevent clumping
- Bring solution to a full boil to ensure complete hydration before setting
- For LM: add calcium after full pectin hydration to control set point
- Avoid prolonged high-heat exposure after setting point — can degrade gel structure`,
  },

  {
    category: 'Hydrocolloids',
    title: 'Hydrocolloid Blending',
    sort_order: 13,
    content_markdown: `## Hydrocolloid Blending

Combining two or more hydrocolloids can produce gels with properties unachievable by any single agent — including improved elasticity, reduced syneresis, softer textures, or enhanced stability. These synergistic effects arise from molecular interactions between polymer networks.

### Key Synergistic Pairs

#### Xanthan Gum + Locust Bean Gum (LBG)

- Produces a **true elastic gel** — neither component gels alone in dilute concentrations
- The galactomannan chains of LBG bind to the backbone of xanthan, forming a cohesive network
- Gel strength peaks at approximately a **1:1 ratio** (xanthan:LBG by weight)
- Typical combined usage: **0.3–0.6% total** (e.g., 0.2% xanthan + 0.2% LBG)
- Gel is thermoreversible; melts on heating, re-sets on cooling

#### Kappa Carrageenan + Locust Bean Gum

- LBG disrupts the rigid kappa network, producing a **softer, more elastic gel** with reduced brittleness
- Reduces tendency toward syneresis common in straight kappa gels
- Typical ratio: **3:1 kappa:LBG** by weight
- Combined usage: **0.3–0.8% total**

#### Agar + Xanthan Gum

- Xanthan added to agar improves **fluid gel** performance — increases yield stress and reduces drainage
- Produces a more cohesive, spoonable texture when sheared during cooling
- Agar contributes thermostability; xanthan contributes pseudoplasticity
- Typical ratio: **0.5–1.5% agar + 0.1–0.3% xanthan**

### Blend Reference Table

| Blend | Synergy Effect | Optimal Ratio (by weight) | Total Use Level |
|---|---|---|---|
| Xanthan + LBG | Elastic gel from non-gelling agents | 1:1 | 0.3–0.6% |
| Kappa carrageenan + LBG | Softer, less brittle kappa gel | 3:1 (kappa:LBG) | 0.3–0.8% |
| Agar + Xanthan | Improved fluid gel stability | 5:1 to 10:1 (agar:xanthan) | 0.6–1.8% |

### General Blending Principles

- Always hydrate each hydrocolloid at its optimal temperature before combining where possible
- Introduce calcium-sensitive hydrocolloids (alginate, LM pectin) last to avoid premature gelation
- Test small batches when modifying ratios — synergistic effects are non-linear
- pH and ionic strength of the base liquid affect all blends; establish baseline conditions first`,
  },

  // ── Precision Cooking ──────────────────────────────────────────────────────

  {
    category: 'Precision Cooking',
    title: 'Beurre Monté',
    sort_order: 1,
    content_markdown: `## Beurre Monté

Beurre monté is an emulsified butter sauce produced by whisking cold butter into a small quantity of hot water, maintaining the emulsion through temperature control rather than additional emulsifiers. The result is a warm, fluid butter emulsion that can be used as a finishing sauce, a poaching medium, or a holding liquid for cooked proteins and vegetables. Its stability is entirely temperature-dependent.

### Emulsion Mechanics

- Butter is an oil-in-water emulsion at room temperature; beurre monté maintains this structure at elevated temperature by keeping water droplets dispersed within butterfat
- The natural lecithin in milk solids acts as the emulsifier
- Temperature must remain within a narrow range — too low causes solidification; too high breaks the emulsion
- Once broken, the emulsion cannot be easily restored without restarting with fresh water

### Temperature and Ratio Parameters

| Parameter | Value | Notes |
|---|---|---|
| Holding temperature | 75–82°C | Below this: butter firms; above this: emulsion breaks |
| Water base | 1 part by weight | Small volume — just enough to initiate emulsion |
| Butter | 8–10 parts by weight | Add cold, in pieces, whisking continuously |
| Maximum hold time | 1–2 hours | Quality degrades; butterfat begins to separate |

### Technique

- Begin with a small amount of water (15–30ml per 250g butter) brought to a simmer in a heavy-bottomed pan
- Reduce heat to maintain 75–80°C; add cold butter in small cubes, whisking vigorously between additions
- Once emulsion is established, additional butter can be incorporated more quickly
- Hold in a bain marie at 75–82°C; do not allow to boil
- Season minimally — salt concentrates as the emulsion reduces

### Applications

- **Poaching medium**: holds fish, lobster, vegetables at precise low temperature without drying
- **Finishing sauce base**: mount with aromatics, acid, or reductions to order
- **Holding liquid**: keeps cooked proteins moist and warm before service without further cooking`,
  },

  {
    category: 'Precision Cooking',
    title: 'Oil Poaching Ratios',
    sort_order: 2,
    content_markdown: `## Oil Poaching Ratios

Oil poaching submerges protein in fat held at a precise low temperature, producing gentle, even cooking without the evaporative cooling effects of water. Because oil is a poor conductor of heat relative to water, it is forgiving of minor temperature fluctuations and produces a distinctly rich, unctuous result. The choice of oil significantly affects flavor transfer.

### Temperature by Protein Type

| Protein | Oil Temperature | Target Internal Temp | Notes |
|---|---|---|---|
| Fish (delicate: halibut, cod) | 60–65°C | 55–58°C | Very short window; monitor closely |
| Fish (fatty: salmon, tuna) | 60–70°C | 50–55°C | Lower end for translucent texture |
| Crustaceans (lobster, shrimp) | 62–68°C | 58–62°C | Overcooks quickly; use thermometer |
| Poultry breast | 68–72°C | 65–68°C | Higher temp needed for food safety |
| Poultry leg / duck confit | 82–85°C | 80–82°C | Extended time for collagen conversion |
| Egg yolk | 63–65°C | 63°C | 45–60 min for custard-like texture |

### Time Guide by Thickness

- General rule: **10 minutes per 25mm of thickness** at 65°C for white fish
- For fatty fish at lower temperatures (60°C), add 20–30% additional time
- Always verify doneness by internal temperature probe, not time alone

### Oil Selection

| Oil | Flavor Impact | Best Applications |
|---|---|---|
| Extra virgin olive oil | High — fruity, grassy | Mediterranean fish, vegetables, eggs |
| Light/refined olive oil | Low | Neutral base for delicate proteins |
| Duck or goose fat | Rich, savory | Poultry confit, potatoes, root vegetables |
| Grapeseed or neutral oil | Minimal | When base flavor of protein should dominate |

### Key Considerations

- Submerge protein fully — partial submersion causes uneven cooking
- Oil volume should be sufficient to maintain stable temperature after adding cold protein
- Oil can be strained and reused; store refrigerated and use within 1 week for fish fats, longer for duck/vegetable-infused`,
  },

  {
    category: 'Precision Cooking',
    title: 'Salt Baking / Crust Cooking',
    sort_order: 3,
    content_markdown: `## Salt Baking / Crust Cooking

Salt crust cooking encases protein or vegetables in a rigid shell of salt and egg white that hardens during cooking, creating a sealed, steam-retaining environment. The crust does not significantly salt the interior — it acts primarily as an insulating and moisture-trapping vessel. The technique produces exceptionally even, moist results and is well suited to whole fish, beets, and bone-in poultry pieces.

### How the Crust Functions

- Egg white proteins coagulate during baking, binding salt crystals into a rigid shell
- The hardened crust traps moisture released by the protein as steam, effectively creating a sealed environment
- Interior temperatures rise more slowly and evenly than open-roasting methods
- Salt does penetrate the outermost surface slightly but does not season the interior uniformly — final seasoning at service is still required

### Crust Ratios

| Component | Ratio by Weight | Notes |
|---|---|---|
| Kosher salt (coarse) | 2 parts | Coarse grain preferred — finer salt packs too densely |
| Egg white | 1 part | Approximately 30g egg white per 60g salt |
| Optional: herbs, citrus zest | To taste | Embed in crust exterior for aromatics |

### Temperature and Time

| Application | Oven Temperature | Approximate Time | Doneness Check |
|---|---|---|---|
| Whole fish (600–800g) | 200–220°C | 25–35 minutes | Thermometer through crust to center |
| Whole beet (medium) | 200°C | 60–90 minutes | Probe for tenderness |
| Bone-in chicken pieces | 200–210°C | 35–50 minutes | Internal 74°C at thickest point |

### Service

- Crack crust tableside with a mallet or the back of a heavy spoon for presentation effect
- Remove all crust fragments before plating — pieces are inedible and highly saline
- Rest protein for 3–5 minutes after cracking before portioning`,
  },

  {
    category: 'Precision Cooking',
    title: 'Pressure Cooking Ratios & Times',
    sort_order: 4,
    content_markdown: `## Pressure Cooking Ratios & Times

Pressure cooking elevates the boiling point of water by raising pressure above atmospheric, enabling cooking temperatures of 120–121°C at standard operating pressure. This accelerates heat transfer and collagen conversion dramatically, reducing conventional braising and stock times by approximately 70%.

### Pressure and Temperature Reference

| Pressure | Temperature | Notes |
|---|---|---|
| 0 PSI (sea level, open) | 100°C | Standard boiling point |
| 7.5 PSI (low / half pressure) | ~110°C | Slower than high |
| 15 PSI (high / standard) | ~121°C | Industry standard reference point |

- Most stovetop pressure cookers operate at **15 PSI** at high setting
- Electric multi-cookers (Instant Pot type) typically reach **10.2–11.6 PSI** (~116–118°C) — adjust times upward by 10–15% vs. stovetop at 15 PSI

### Minimum Liquid Requirements

| Cooker Capacity | Minimum Liquid |
|---|---|
| Up to 4L | 250ml |
| 4–8L | 375ml |
| 8L+ | 500ml |

### Time Reduction vs. Conventional Cooking

| Application | Conventional Time | Pressure Time (15 PSI) | Reduction |
|---|---|---|---|
| Beef stock | 6–8 hours | 2–2.5 hours | ~65–70% |
| Braised short rib | 3–4 hours | 45–60 minutes | ~70% |
| Dried legumes (soaked) | 60–90 minutes | 8–12 minutes | ~85% |
| Dried legumes (unsoaked) | 90–120 minutes | 20–30 minutes | ~75% |
| Whole grain risotto base | 25–30 minutes | 6–8 minutes | ~75% |
| Root vegetable braise | 40–60 minutes | 10–15 minutes | ~75% |

### Key Operating Principles

- Always bring cooker to full pressure before starting the timer
- **Natural release**: pressure drops gradually (10–20 minutes); preferred for proteins and legumes
- **Quick release**: vent immediately; preferred for vegetables and grains to prevent overcooking
- Do not fill above **two-thirds capacity** for solids; **half capacity** for liquids and foaming foods
- Thickening agents (starch slurries, cream) should be added **after** pressure cooking`,
  },
]

async function seed() {
  console.log(`Upserting ${standards.length} modernist reference entries…`)

  const { data, error } = await supabase
    .from('culinary_standards')
    .upsert(standards, { onConflict: 'category,title', ignoreDuplicates: false })
    .select('category, title')

  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Upserted ${data.length} records:`)
  data.forEach(r => console.log(`  [${r.category}] ${r.title}`))
}

seed()
