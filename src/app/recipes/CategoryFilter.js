'use client'
import { useState } from 'react'

const SOURCE_FILTERS = [
  { id: 'all',               label: 'All Sources' },
  { id: 'Instagram Extract', label: '📸 Instagram' },
  { id: 'Web Import',        label: '🌐 Web' },
  { id: 'PDF Import',        label: '📄 PDF' },
  { id: 'Image Import',      label: '📷 Photo' },
  { id: 'Text Import',       label: '📝 Text' },
  { id: 'beverage',          label: '🍹 Beverage' },
]

const MEAL_TYPES = [
  { id: 'breakfast',        label: '🌅 Breakfast' },
  { id: 'lunch',            label: '☀️ Lunch' },
  { id: 'dinner',           label: '🍽 Dinner' },
  { id: 'dessert',          label: '🍰 Dessert' },
  { id: 'snack',            label: '🥨 Snack' },
  { id: 'appetizer',        label: '🥗 Appetizer' },
  { id: 'beverage',         label: '🍹 Beverage' },
  { id: 'sauce/condiment',  label: '🫙 Sauce' },
]

const DIETARY_FLAGS = [
  { id: 'omnivore',     label: 'Omnivore' },
  { id: 'vegetarian',   label: '🌿 Vegetarian' },
  { id: 'vegan',        label: '🌱 Vegan' },
  { id: 'pescatarian',  label: '🐟 Pescatarian' },
  { id: 'gluten-free',  label: 'Gluten-Free' },
  { id: 'dairy-free',   label: 'Dairy-Free' },
  { id: 'nut-free',     label: 'Nut-Free' },
  { id: 'keto',         label: 'Keto' },
  { id: 'paleo',        label: 'Paleo' },
  { id: 'whole30',      label: 'Whole30' },
  { id: 'kosher',       label: 'Kosher' },
  { id: 'halal',        label: 'Halal' },
]

const COOKING_STYLES = [
  { id: 'baking',        label: 'Baking' },
  { id: 'grilling',      label: 'Grilling' },
  { id: 'braising',      label: 'Braising' },
  { id: 'sous-vide',     label: 'Sous-Vide' },
  { id: 'roasting',      label: 'Roasting' },
  { id: 'sautéing',      label: 'Sautéing' },
  { id: 'raw/no-cook',   label: 'No-Cook' },
  { id: 'frying',        label: 'Frying' },
  { id: 'boiling',       label: 'Boiling' },
  { id: 'steaming',      label: 'Steaming' },
  { id: 'slow-cooking',  label: 'Slow-Cook' },
  { id: 'smoking',       label: 'Smoking' },
  { id: 'fermenting',    label: 'Fermenting' },
]

export default function CategoryFilter({ filters, onChange, sourceFilter, onSourceChange }) {
  const [openSections, setOpenSections] = useState({ source: false, mealTypes: false, dietary: false, cooking: false })

  function toggleSection(section) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  function toggleMealType(id) {
    const next = filters.mealTypes.includes(id)
      ? filters.mealTypes.filter(x => x !== id)
      : [...filters.mealTypes, id]
    onChange({ ...filters, mealTypes: next })
  }

  function toggleDietary(id) {
    const next = filters.dietaryFlags.includes(id)
      ? filters.dietaryFlags.filter(x => x !== id)
      : [...filters.dietaryFlags, id]
    onChange({ ...filters, dietaryFlags: next })
  }

  function toggleCooking(id) {
    const next = filters.cookingStyles.includes(id)
      ? filters.cookingStyles.filter(x => x !== id)
      : [...filters.cookingStyles, id]
    onChange({ ...filters, cookingStyles: next })
  }

  const catActiveCount = filters.mealTypes.length + filters.dietaryFlags.length + filters.cookingStyles.length
  const sourceActive = sourceFilter !== 'all'
  const totalActive = catActiveCount + (sourceActive ? 1 : 0)
  const hasAny = totalActive > 0

  function clearAll() {
    onChange({ mealTypes: [], dietaryFlags: [], cookingStyles: [] })
    onSourceChange('all')
  }

  function Section({ title, sectionKey, count, children }) {
    return (
      <div className="border-b border-gray-800 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-800/30 transition-colors rounded"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
            {count > 0 && (
              <span className="text-xs bg-[#D35400] text-white px-1.5 py-0.5 rounded-full font-bold leading-none">{count}</span>
            )}
          </div>
          <span className="text-gray-600 text-[10px]" style={{ transform: openSections[sectionKey] ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
        </button>
        {openSections[sectionKey] && (
          <div className="pb-3 space-y-1">{children}</div>
        )}
      </div>
    )
  }

  function CheckItem({ label, checked, onChange: onChg }) {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer py-1 text-sm text-gray-300 hover:text-white transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChg}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-[#D35400] checked:border-[#D35400] cursor-pointer flex-shrink-0"
        />
        <span>{label}</span>
      </label>
    )
  }

  function RadioItem({ label, value }) {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer py-1 text-sm text-gray-300 hover:text-white transition-colors">
        <input
          type="radio"
          name="source"
          value={value}
          checked={sourceFilter === value}
          onChange={() => onSourceChange(value)}
          className="w-4 h-4 border-gray-600 bg-gray-800 checked:accent-[#D35400] cursor-pointer flex-shrink-0"
        />
        <span>{label}</span>
      </label>
    )
  }

  return (
    <div className="bg-[#0E1117] border border-gray-800 rounded p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-400">FILTERS</span>
        {hasAny && (
          <button onClick={clearAll} className="text-xs text-[#D35400] hover:text-[#E67E22] font-bold transition-colors">
            Clear all ({totalActive})
          </button>
        )}
      </div>

      <div>
        <Section title="Source" sectionKey="source" count={sourceActive ? 1 : 0}>
          {SOURCE_FILTERS.map(f => <RadioItem key={f.id} label={f.label} value={f.id} />)}
        </Section>

        <Section title="Meal Type" sectionKey="mealTypes" count={filters.mealTypes.length}>
          {MEAL_TYPES.map(m => (
            <CheckItem key={m.id} label={m.label} checked={filters.mealTypes.includes(m.id)} onChange={() => toggleMealType(m.id)} />
          ))}
        </Section>

        <Section title="Dietary" sectionKey="dietary" count={filters.dietaryFlags.length}>
          {DIETARY_FLAGS.map(d => (
            <CheckItem key={d.id} label={d.label} checked={filters.dietaryFlags.includes(d.id)} onChange={() => toggleDietary(d.id)} />
          ))}
        </Section>

        <Section title="Cooking Method" sectionKey="cooking" count={filters.cookingStyles.length}>
          {COOKING_STYLES.map(c => (
            <CheckItem key={c.id} label={c.label} checked={filters.cookingStyles.includes(c.id)} onChange={() => toggleCooking(c.id)} />
          ))}
        </Section>
      </div>
    </div>
  )
}
