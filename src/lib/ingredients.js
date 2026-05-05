/**
 * ingredients.js
 * Pure JS utility library for SousChef recipe app.
 * Powers: dynamic scaling, unit conversion, baker's percentages.
 * No external dependencies.
 */

// ---------------------------------------------------------------------------
// Unit tables
// ---------------------------------------------------------------------------

/** Maps every recognized alias → canonical unit key */
const UNIT_ALIASES = {
  // Weight
  gram: 'g', grams: 'g', g: 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',

  // Volume
  ml: 'ml', mL: 'ml',
  milliliter: 'ml', milliliters: 'ml',
  millilitre: 'ml', millilitres: 'ml',
  l: 'L', L: 'L',
  liter: 'L', liters: 'L',
  litre: 'L', litres: 'L',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', t: 'tsp',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp',
  T: 'tbsp', Tbsp: 'tbsp', tbs: 'tbsp',
  cup: 'cup', cups: 'cup', c: 'cup',
  'fluid ounce': 'floz', 'fluid ounces': 'floz',
  'fl oz': 'floz', 'fl. oz.': 'floz',
  pint: 'pt', pints: 'pt', pt: 'pt',
  quart: 'qt', quarts: 'qt', qt: 'qt',

  // Count / misc
  pinch: 'pinch', pinches: 'pinch',
  clove: 'clove', cloves: 'clove',
  slice: 'slice', slices: 'slice',
  piece: 'piece', pieces: 'piece',
  sheet: 'sheet', sheets: 'sheet',
  sprig: 'sprig', sprigs: 'sprig',
};

/** Conversion factors to base unit (g for weight, ml for volume) */
const WEIGHT_TO_G = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME_TO_ML = {
  ml: 1, L: 1000,
  tsp: 4.92892, tbsp: 14.7868,
  cup: 236.588, floz: 29.5735,
  pt: 473.176, qt: 946.353,
};

const WEIGHT_UNITS = new Set(Object.keys(WEIGHT_TO_G));
const VOLUME_UNITS = new Set(Object.keys(VOLUME_TO_ML));

/** Display strings for canonical unit keys */
const UNIT_DISPLAY = {
  g: 'g', kg: 'kg', oz: 'oz', lb: 'lb',
  ml: 'ml', L: 'L',
  tsp: 'tsp', tbsp: 'tbsp', cup: 'cup',
  floz: 'fl oz', pt: 'pt', qt: 'qt',
  pinch: 'pinch', clove: 'clove', slice: 'slice',
  piece: 'piece', sheet: 'sheet', sprig: 'sprig',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to look up a token in UNIT_ALIASES.
 * Tries exact match first, then lowercased.
 * Returns canonical key or null.
 */
function lookupUnit(token) {
  if (!token) return null;
  if (token in UNIT_ALIASES) return UNIT_ALIASES[token];
  const low = token.toLowerCase();
  if (low in UNIT_ALIASES) return UNIT_ALIASES[low];
  return null;
}

/**
 * Parse a quantity string fragment → number | null.
 * Handles: integer, decimal, simple fraction, mixed fraction, range (lower bound).
 */
function parseQuantityStr(str) {
  if (!str) return null;
  str = str.trim();

  // Range like "3-4" → take lower bound
  const rangeMatch = str.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*\d+(?:\.\d+)?$/);
  if (rangeMatch) return parseFloat(rangeMatch[1]);

  // Mixed fraction like "2 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Simple fraction like "1/3"
  const fracMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);

  // Decimal or integer
  if (/^\d+(?:\.\d+)?$/.test(str)) return parseFloat(str);

  return null;
}

// ---------------------------------------------------------------------------
// parseIngredient
// ---------------------------------------------------------------------------

/**
 * Parses one raw ingredient line into structured fields.
 * Strategy: tokenise front of string for quantity then unit, then extract
 * trailing notes, leaving the ingredient name in the middle.
 *
 * @param {string} rawText
 * @returns {{ raw, quantity, unit, name, note }}
 */
export function parseIngredient(rawText) {
  const raw = rawText;
  let text = rawText.trim();

  // --- Extract trailing note in parentheses, e.g. "(70%)" or "(room temperature)"
  let parenNote = null;
  text = text.replace(/\(([^)]*)\)\s*$/, (_, inner) => {
    parenNote = inner.trim();
    return '';
  }).trim();

  // --- Extract trailing note after a comma, e.g. ", sifted" or ", room temperature"
  let commaNote = null;
  const commaIdx = text.indexOf(',');
  if (commaIdx !== -1) {
    commaNote = text.slice(commaIdx + 1).trim();
    text = text.slice(0, commaIdx).trim();
  }

  // Combine notes (paren takes precedence as secondary detail, comma is primary prep note)
  let note = null;
  if (commaNote && parenNote) note = `${commaNote} (${parenNote})`;
  else if (commaNote) note = commaNote;
  else if (parenNote) note = parenNote;

  // --- Quantity parsing
  let quantity = null;
  let unit = null;

  // Special word quantities: "a pinch of …", "a …", "an …"
  // "a pinch" → quantity=null, unit=pinch
  const aPinchMatch = text.match(/^a\s+(pinch|clove|slice|piece|sheet|sprig)\b/i);
  if (aPinchMatch) {
    unit = lookupUnit(aPinchMatch[1]);
    // strip the matched prefix
    text = text.slice(aPinchMatch[0].length).trim();
    // strip leading "of" if present
    text = text.replace(/^of\s+/i, '');
    return { raw, quantity: null, unit, name: text || raw, note };
  }

  // "a" or "an" → quantity 1
  const aAnMatch = text.match(/^(an?)\s+/i);
  if (aAnMatch) {
    quantity = 1;
    text = text.slice(aAnMatch[0].length).trim();
  }

  // Try to parse a numeric quantity from the front of the remaining text.
  // Patterns tried in order:
  //   1) mixed fraction: "2 1/2"
  //   2) range: "3-4"
  //   3) plain fraction: "1/3"
  //   4) decimal/integer: "1.5" or "500"
  if (quantity === null) {
    // Multi-part compound quantity: "1/3 cup + 2 tbsp" — take the first segment only
    // (the "+" part is unusual; we parse the first quantity/unit pair and note the rest)
    const plusMatch = text.match(/^(.+?)\s*\+\s*(.+)$/);
    if (plusMatch) {
      // Parse both parts and try to combine them
      const part1 = parseIngredientQuantityUnit(plusMatch[1].trim());
      const part2 = parseIngredientQuantityUnit(plusMatch[2].trim());

      // Determine the ingredient name portion: everything after part2's qty+unit token
      // Strip leading qty+unit from plusMatch[2] to get the remaining name text
      const part2NameText = plusMatch[2].replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*[a-zA-Z.]*\s*/, '').trim();

      if (part1.quantity !== null && part2.quantity !== null && part1.unit && part2.unit) {
        if (part1.unit === part2.unit) {
          // Same unit — direct sum
          quantity = part1.quantity + part2.quantity;
          unit = part1.unit;
        } else {
          // Different units — try converting part2 into part1's unit and summing
          const converted = convertUnit(part2.quantity, part2.unit, part1.unit);
          if (converted) {
            quantity = part1.quantity + converted.quantity;
            unit = part1.unit;
          } else {
            // Incompatible dimensions — just use part1
            quantity = part1.quantity;
            unit = part1.unit;
          }
        }
        text = part2NameText;
      } else if (part1.quantity !== null && part1.unit) {
        // Only part1 is parseable
        quantity = part1.quantity;
        unit = part1.unit;
        text = part2NameText;
      }
    }

    if (quantity === null) {
      const qMatch = text.match(
        /^(\d+\s+\d+\/\d+|\d+[-–]\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*/
      );
      if (qMatch) {
        quantity = parseQuantityStr(qMatch[1].replace(/\s+/, ' '));
        text = text.slice(qMatch[0].length).trim();
      }
    }
  } else {
    // Already set quantity=1 from "a/an"; text already has prefix stripped
  }

  // --- Unit parsing (only if quantity was found or we still have leading text)
  if (unit === null) {
    // Try multi-word units first: "fl oz", "fl. oz.", "fluid ounce(s)"
    const multiWordUnit = text.match(
      /^(fl\.?\s*oz\.?|fluid\s+ounces?)\s*/i
    );
    if (multiWordUnit) {
      unit = lookupUnit(multiWordUnit[1].replace(/\s+/g, ' ').toLowerCase().replace(/\.$/, '').trim()) ?? 'floz';
      text = text.slice(multiWordUnit[0].length).trim();
    } else {
      // Single-word unit token
      const unitMatch = text.match(/^([a-zA-Z.]+)\s*/);
      if (unitMatch) {
        const candidate = lookupUnit(unitMatch[1]);
        if (candidate !== null) {
          unit = candidate;
          text = text.slice(unitMatch[0].length).trim();
        }
        // If not a recognized unit and quantity is null, this word is part of the name
      }
    }
  }

  // Strip leading "of" (e.g. "zest of 1 lemon" → after "zest" we'd have "of 1 lemon")
  // This is handled below in name cleanup.

  // --- What remains is the ingredient name
  // Strip leading "of " connector
  let name = text.replace(/^of\s+/i, '').trim();

  // If we consumed everything (e.g. "1/3 cup + 2 tbsp heavy cream") the name
  // may still be hiding in original text after the unit portions.
  if (!name && quantity !== null) {
    // Fallback: strip quantity and unit tokens from raw (minus notes) and use the rest
    name = raw.trim();
  }

  if (!name) name = raw.trim();

  return { raw, quantity, unit: unit || null, name, note };
}

/**
 * Internal helper: parse a short fragment like "2 tbsp" or "1/3 cup"
 * Returns { quantity, unit } — used for compound "+" expressions.
 */
function parseIngredientQuantityUnit(fragment) {
  fragment = fragment.trim();
  let quantity = null;
  let unit = null;

  const qMatch = fragment.match(
    /^(\d+\s+\d+\/\d+|\d+[-–]\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*/
  );
  if (qMatch) {
    quantity = parseQuantityStr(qMatch[1].replace(/\s+/, ' '));
    fragment = fragment.slice(qMatch[0].length).trim();
  }

  const unitMatch = fragment.match(/^([a-zA-Z.]+)/);
  if (unitMatch) {
    unit = lookupUnit(unitMatch[1]);
  }

  return { quantity, unit };
}

// ---------------------------------------------------------------------------
// formatQuantity
// ---------------------------------------------------------------------------

/** Common fractions we try to snap to, as [decimal, display string] pairs */
const NICE_FRACTIONS = [
  [1/8, '1/8'], [1/4, '1/4'], [1/3, '1/3'], [3/8, '3/8'],
  [1/2, '1/2'], [5/8, '5/8'], [2/3, '2/3'], [3/4, '3/4'], [7/8, '7/8'],
];
const FRACTION_TOLERANCE = 0.02;

/**
 * Format a number as a clean fraction / mixed number string.
 *
 * @param {number} num
 * @returns {string}
 */
export function formatQuantity(num) {
  if (num === 0) return '0';

  // Exact integer
  if (Number.isInteger(num)) return String(num);

  const whole = Math.floor(num);
  const frac = num - whole;

  // Try to snap the fractional part to a nice fraction
  for (const [val, str] of NICE_FRACTIONS) {
    if (Math.abs(frac - val) <= FRACTION_TOLERANCE) {
      return whole === 0 ? str : `${whole} ${str}`;
    }
  }

  // No nice fraction found — round to 2 decimal places and strip trailing zeros
  const rounded = num.toFixed(2).replace(/\.?0+$/, '');
  return rounded;
}

// ---------------------------------------------------------------------------
// convertUnit
// ---------------------------------------------------------------------------

/**
 * Convert a quantity from one unit to another within the same dimension.
 *
 * @param {number} quantity
 * @param {string} fromUnit  canonical unit key
 * @param {string} toUnit    canonical unit key
 * @returns {{ quantity: number, unit: string } | null}
 */
export function convertUnit(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return { quantity, unit: toUnit };

  const fromIsWeight = WEIGHT_UNITS.has(fromUnit);
  const toIsWeight   = WEIGHT_UNITS.has(toUnit);
  const fromIsVol    = VOLUME_UNITS.has(fromUnit);
  const toIsVol      = VOLUME_UNITS.has(toUnit);

  if (fromIsWeight && toIsWeight) {
    const grams = quantity * WEIGHT_TO_G[fromUnit];
    return { quantity: grams / WEIGHT_TO_G[toUnit], unit: toUnit };
  }

  if (fromIsVol && toIsVol) {
    const ml = quantity * VOLUME_TO_ML[fromUnit];
    return { quantity: ml / VOLUME_TO_ML[toUnit], unit: toUnit };
  }

  // Cross-dimension conversion is impossible
  return null;
}

// ---------------------------------------------------------------------------
// parseMarkdownIngredients
// ---------------------------------------------------------------------------

/**
 * Extract raw ingredient list items from a markdown recipe string.
 * Looks for a "## Ingredients" section and grabs all "- " or "* " lines
 * until the next "##" heading or end of string.
 *
 * @param {string} markdown
 * @returns {string[]}
 */
export function parseMarkdownIngredients(markdown) {
  // Find the ingredients section (case-insensitive)
  const sectionMatch = markdown.match(
    /^##\s+ingredients\b[^\n]*/im
  );
  if (!sectionMatch) return [];

  const startIdx = sectionMatch.index + sectionMatch[0].length;
  let section = markdown.slice(startIdx);

  // Trim at the next ## heading
  const nextHeading = section.match(/^##\s/m);
  if (nextHeading) section = section.slice(0, nextHeading.index);

  const lines = section.split('\n');
  const results = [];
  for (const line of lines) {
    const m = line.match(/^[-*]\s+(.+)/);
    if (m) results.push(m[1].trim());
  }
  return results;
}

// ---------------------------------------------------------------------------
// parseYield
// ---------------------------------------------------------------------------

/**
 * Scan markdown for yield / serving information.
 *
 * @param {string} markdown
 * @returns {{ amount: number, label: string } | null}
 */
export function parseYield(markdown) {
  // Patterns like **Yield:** 24 cookies  /  Yield: 24 cookies
  // **Serves:** 8  /  **Makes:** 2 dozen
  const inlinePatterns = [
    /\*{0,2}(?:yield|serves?|servings?|makes?)\s*:?\*{0,2}\s*(\d+(?:\.\d+)?)\s*([^\n*]+)?/gi,
  ];

  for (const re of inlinePatterns) {
    let m;
    // Reset lastIndex each time we loop through markdown
    re.lastIndex = 0;
    while ((m = re.exec(markdown)) !== null) {
      const amount = parseFloat(m[1]);
      const rest = (m[2] || '').trim().replace(/\*+$/, '').trim();
      const label = rest ? `${m[1]} ${rest}` : String(m[1]);
      if (!isNaN(amount)) return { amount, label };
    }
  }

  // "2 dozen" style (word number for dozen)
  const dozenMatch = markdown.match(
    /\*{0,2}(?:yield|serves?|servings?|makes?)\s*:?\*{0,2}\s*(\d+)\s+dozen/i
  );
  if (dozenMatch) {
    const amount = parseInt(dozenMatch[1]) * 12;
    return { amount, label: `${dozenMatch[1]} dozen` };
  }

  // ## Yield / ## Serves section heading followed by text on next non-empty line
  const headingMatch = markdown.match(
    /^##\s+(?:yield|serves?|servings?|makes?)\s*\n+([^\n]+)/im
  );
  if (headingMatch) {
    const lineText = headingMatch[1].trim();
    const numMatch = lineText.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      return { amount: parseFloat(numMatch[1]), label: lineText };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// detectFlour
// ---------------------------------------------------------------------------

/**
 * Returns true if any ingredient's name contains "flour" (case-insensitive).
 *
 * @param {Array<{ name: string }>} parsedList
 * @returns {boolean}
 */
export function detectFlour(parsedList) {
  return parsedList.some(ing => /flour/i.test(ing.name));
}

// ---------------------------------------------------------------------------
// bakersPercentages
// ---------------------------------------------------------------------------

/**
 * Compute baker's percentages relative to total flour weight.
 * Only processes ingredients that have a weight unit (g, kg, oz, lb).
 *
 * @param {Array<{ name, quantity, unit }>} parsedList
 * @returns {Array<{ name, percentage, weightG, unit, quantity }>}
 */
export function bakersPercentages(parsedList) {
  const weightedIngredients = parsedList.filter(
    ing => ing.quantity !== null && WEIGHT_UNITS.has(ing.unit)
  );

  // Convert each weighted ingredient to grams
  const withGrams = weightedIngredients.map(ing => ({
    ...ing,
    weightG: ing.quantity * WEIGHT_TO_G[ing.unit],
  }));

  // Identify flour entries
  const flourEntries = withGrams.filter(ing => /flour/i.test(ing.name));
  const totalFlourG = flourEntries.reduce((sum, ing) => sum + ing.weightG, 0);

  if (totalFlourG === 0) return [];

  const flourNames = new Set(flourEntries.map(ing => ing.name));

  const results = withGrams.map(ing => ({
    name: ing.name,
    percentage: (ing.weightG / totalFlourG) * 100,
    weightG: ing.weightG,
    unit: ing.unit,
    quantity: ing.quantity,
    _isFlour: flourNames.has(ing.name),
  }));

  // Sort: flour entries first, then by percentage descending
  results.sort((a, b) => {
    if (a._isFlour && !b._isFlour) return -1;
    if (!a._isFlour && b._isFlour) return 1;
    return b.percentage - a.percentage;
  });

  // Strip internal sort key before returning
  return results.map(({ _isFlour, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// ingredientRatios
// ---------------------------------------------------------------------------

/**
 * Compute ingredient ratios relative to a chosen base ingredient.
 * Works for weight-unit recipes (normalises to g) or volume-unit recipes (normalises to ml).
 * Returns [{name, ratio, display}] sorted base-first then descending.
 *
 * @param {ReturnType<parseIngredient>[]} parsedList
 * @param {string} baseName  — must match an ingredient's `name` field exactly
 * @returns {{name: string, ratio: number, display: string}[]}
 */
export function ingredientRatios(parsedList, baseName) {
  if (!baseName) return [];
  const base = parsedList.find(p => p.name === baseName);
  if (!base || base.quantity === null) return [];

  let dimension = null;
  let baseValue = null;

  if (base.unit && WEIGHT_UNITS.has(base.unit)) {
    const result = convertUnit(base.quantity, base.unit, 'g');
    if (result) { dimension = 'weight'; baseValue = result.quantity; }
  } else if (base.unit && VOLUME_UNITS.has(base.unit)) {
    const result = convertUnit(base.quantity, base.unit, 'ml');
    if (result) { dimension = 'volume'; baseValue = result.quantity; }
  }

  if (!dimension || !baseValue) return [];

  const targetUnit = dimension === 'weight' ? 'g' : 'ml';

  const rows = [];
  for (const ing of parsedList) {
    if (ing.quantity === null || !ing.unit) continue;
    const converted = convertUnit(ing.quantity, ing.unit, targetUnit);
    if (!converted) continue;
    const ratio = (converted.quantity / baseValue) * 100;
    rows.push({ name: ing.name, ratio, display: `${ratio.toFixed(1)}%` });
  }

  // Sort: base first (100%), rest descending by ratio
  rows.sort((a, b) => {
    if (a.name === baseName) return -1;
    if (b.name === baseName) return 1;
    return b.ratio - a.ratio;
  });

  return rows;
}

// ---------------------------------------------------------------------------
// formatIngredient
// ---------------------------------------------------------------------------

/**
 * Unit system preference tables for metric / imperial conversion targets.
 */
const METRIC_WEIGHT_PREF    = ['g', 'kg'];
const IMPERIAL_WEIGHT_PREF  = ['oz', 'lb'];
const METRIC_VOLUME_PREF    = ['ml', 'L'];
const IMPERIAL_VOLUME_PREF  = ['cup', 'tbsp', 'tsp'];

/**
 * Smart threshold conversion: pick the most human-readable unit in the
 * target system based on the magnitude of the value.
 */
function pickBestUnit(valueInBase, dimension, system) {
  if (dimension === 'weight') {
    if (system === 'metric') {
      // base = g
      return valueInBase >= 1000 ? 'kg' : 'g';
    } else {
      // base = g → convert to oz first
      const oz = valueInBase / WEIGHT_TO_G['oz'];
      return oz > 32 ? 'lb' : 'oz';
    }
  } else {
    // volume, base = ml
    if (system === 'metric') {
      return valueInBase >= 1000 ? 'L' : 'ml';
    } else {
      // Prefer cup when >= 1 cup (236.588 ml), else tbsp (>=14.79 ml), else tsp
      if (valueInBase >= VOLUME_TO_ML['cup']) return 'cup';
      if (valueInBase >= VOLUME_TO_ML['tbsp']) return 'tbsp';
      return 'tsp';
    }
  }
}

/**
 * Format a parsed ingredient back to a human-readable string, applying
 * an optional scale factor and target unit system.
 *
 * @param {{ raw, quantity, unit, name, note }} parsed
 * @param {number} scaleFactor     e.g. 2 = double, 0.5 = halve
 * @param {'auto'|'metric'|'imperial'} targetUnitSystem
 * @returns {string}
 */
export function formatIngredient(parsed, scaleFactor, targetUnitSystem) {
  // Cannot scale ingredients with no detected quantity
  if (parsed.quantity === null) return parsed.raw;

  let scaled = parsed.quantity * scaleFactor;
  let currentUnit = parsed.unit;

  // --- Unit system conversion
  if (targetUnitSystem !== 'auto' && currentUnit) {
    const isWeight = WEIGHT_UNITS.has(currentUnit);
    const isVol    = VOLUME_UNITS.has(currentUnit);

    if (isWeight) {
      const systemWantsMetric   = targetUnitSystem === 'metric';
      const alreadyCorrect =
        systemWantsMetric
          ? METRIC_WEIGHT_PREF.includes(currentUnit)
          : IMPERIAL_WEIGHT_PREF.includes(currentUnit);

      if (!alreadyCorrect) {
        // Convert to grams as intermediate base
        const inG = scaled * WEIGHT_TO_G[currentUnit];
        const bestUnit = pickBestUnit(inG, 'weight', targetUnitSystem);
        scaled = inG / WEIGHT_TO_G[bestUnit];
        currentUnit = bestUnit;
      } else {
        // Already correct system — still apply smart thresholds
        const inG = scaled * WEIGHT_TO_G[currentUnit];
        const bestUnit = pickBestUnit(inG, 'weight', targetUnitSystem);
        if (bestUnit !== currentUnit) {
          scaled = inG / WEIGHT_TO_G[bestUnit];
          currentUnit = bestUnit;
        }
      }
    } else if (isVol) {
      const systemWantsMetric = targetUnitSystem === 'metric';
      const alreadyCorrect =
        systemWantsMetric
          ? METRIC_VOLUME_PREF.includes(currentUnit)
          : IMPERIAL_VOLUME_PREF.includes(currentUnit);

      if (!alreadyCorrect) {
        const inMl = scaled * VOLUME_TO_ML[currentUnit];
        const bestUnit = pickBestUnit(inMl, 'volume', targetUnitSystem);
        scaled = inMl / VOLUME_TO_ML[bestUnit];
        currentUnit = bestUnit;
      } else {
        // Apply smart thresholds within same system
        const inMl = scaled * VOLUME_TO_ML[currentUnit];
        const bestUnit = pickBestUnit(inMl, 'volume', targetUnitSystem);
        if (bestUnit !== currentUnit) {
          scaled = inMl / VOLUME_TO_ML[bestUnit];
          currentUnit = bestUnit;
        }
      }
    }
    // Count/misc units (pinch, clove, etc.) are left unchanged
  }

  // --- Format the quantity
  const qtyStr = formatQuantity(scaled);

  // --- Assemble display string
  const unitDisplay = currentUnit ? (UNIT_DISPLAY[currentUnit] || currentUnit) : null;
  const noteStr = parsed.note ? `, ${parsed.note}` : '';

  if (unitDisplay) {
    return `${qtyStr} ${unitDisplay} ${parsed.name}${noteStr}`;
  } else {
    return `${qtyStr} ${parsed.name}${noteStr}`;
  }
}

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

/**
 * Format an ISO 8601 date string to a human-readable date.
 *
 * @param {string} isoString - ISO 8601 date string (e.g., '2026-01-15T10:30:00Z')
 * @param {object} options - Optional formatting options
 * @param {string} options.format - 'short' (default: "Jan 15, 2026"), 'long', or 'time'
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @param {string} options.nullFallback - String to return if isoString is empty/null (default: '')
 * @returns {string}
 */
export function formatDate(isoString, options = {}) {
  const { format = 'short', locale = 'en-US', nullFallback = '' } = options

  if (!isoString) return nullFallback

  try {
    const date = new Date(isoString)

    if (format === 'time') {
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Default 'short' format: "Jan 15, 2026"
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return nullFallback
  }
}

// ---------------------------------------------------------------------------
// buildScaledMarkdown
// ---------------------------------------------------------------------------

/**
 * Rebuild a markdown recipe string with the ingredients section scaled.
 * All other sections (Method, Notes, etc.) are left unchanged.
 * Returns the original markdown unchanged if scaleFactor is 1 or no ingredients section is found.
 */
export function buildScaledMarkdown(markdown, scaleFactor, unitSystem = 'auto') {
  if (!markdown) return markdown
  if (Math.abs(scaleFactor - 1) < 0.001) return markdown

  // Locate the ## Ingredients heading (case-insensitive)
  const headingMatch = markdown.match(/^(##\s+ingredients\b[^\n]*\n)/im)
  if (!headingMatch) return markdown

  const headingStart = headingMatch.index
  const afterHeading = headingStart + headingMatch[0].length
  const rest = markdown.slice(afterHeading)

  // Find where the ingredients section ends (next ## heading or end of string)
  const nextHeadingMatch = rest.match(/^##\s/m)
  const sectionLength = nextHeadingMatch ? nextHeadingMatch.index : rest.length

  const ingredientSection = rest.slice(0, sectionLength)
  const afterSection = rest.slice(sectionLength)
  const before = markdown.slice(0, headingStart)

  // Scale each list item line
  const scaledSection = ingredientSection.replace(/^([-*]\s+)(.+)$/gm, (_line, bullet, rawText) => {
    const parsed = parseIngredient(rawText.trim())
    return `${bullet}${formatIngredient(parsed, scaleFactor, unitSystem)}`
  })

  // Add a scale note just before the ingredients heading
  const scaleLabel = scaleFactor < 1
    ? `÷${(1 / scaleFactor).toFixed(2).replace(/\.?0+$/, '')}`
    : `×${scaleFactor.toFixed(2).replace(/\.?0+$/, '')}`
  const scaleNote = `_Scaled ${scaleLabel}_\n\n`

  return scaleNote + before + headingMatch[0] + scaledSection + afterSection
}
