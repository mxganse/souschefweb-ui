'use client'
import { useState } from 'react'

const MEAL_TYPES = [
  { id: 'breakfast', label: '🌅 Breakfast' },
  { id: 'lunch', label: '☀️ Lunch' },
  { id: 'dinner', label: '🍽 Dinner' },
  { id: 'dessert', label: '🍰 Dessert' },
  { id: 'snack', label: '🥨 Snack' },
  { id: 'appetizer', label: '🥗 Appetizer' },
  { id: 'beverage', label: '🍹 Beverage' },
  { id: 'sauce/condiment', label: '🫙 Sauce' },
]

const DIETARY_FLAGS = [
  { id: 'omnivore', label: 'Omnivore' },
  { id: 'vegetarian', label: '🌿 Vegetarian' },
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'pescatarian', label: '🐟 Pescatarian' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'nut-free', label: 'Nut-Free' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'whole30', label: 'Whole30' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'halal', label: 'Halal' },
]

const COOKING_STYLES = [
  { id: 'baking', label: 'Baking' },
  { id: 'grilling', label: 'Grilling' },
  { id: 'braising', label: 'Braising' },
  { id: 'sous-vide', label: 'Sous-Vide' },
  { id: 'roasting', label: 'Roasting' },
  { id: 'sautéing', label: 'Sautéing' },
  { id: 'raw/no-cook', label: 'No-Cook' },
  { id: 'frying', label: 'Frying' },
  { id: 'boiling', label: 'Boiling' },
  { id: 'steaming', label: 'Steaming' },
  { id: 'slow-cooking', label: 'Slow-Cook' },
  { id: 'smoking', label: 'Smoking' },
  { id: 'fermenting', label: 'Fermenting' },
]

export default function CategoryFilter({ filters, onChange }) {
  const [openSections, setOpenSections] = useState({ mealTypes: true, dietary: true, cooking: true })

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

  const hasFilters = filters.mealTypes.length > 0 || filters.dietaryFlags.length > 0 || filters.cookingStyles.length > 0
  const activeCount = filters.mealTypes.length + filters.dietaryFlags.length + filters.cookingStyles.length

  function FilterSection({ title, items, selected, onToggle, sectionKey, activeCount: count }) {
    return (
      <div className="border-b border-gray-800 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-0 py-3 text-left hover:bg-gray-800/30 transition-colors rounded"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
            {count > 0 && (
              <span className="text-xs bg-[#D35400] text-white px-1.5 py-0.5 rounded-full font-bold">{count}</span>
            )}
          </div>
          <span className="text-gray-600 transition-transform" style={{ transform: openSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {openSections[sectionKey] && (
          <div className="pb-3 space-y-2">
            {items.map(item => (
              <label key={item.id} className="flex items-center gap-2.5 cursor-pointer px-0 py-1 text-sm text-gray-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-[#D35400] checked:border-[#D35400] cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#0E1117] border border-gray-800 rounded p-4 mb-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-400">FILTERS</span>
        {hasFilters && (
          <button
            onClick={() => onChange({ mealTypes: [], dietaryFlags: [], cookingStyles: [] })}
            className="text-xs text-[#D35400] hover:text-[#E67E22] font-bold transition-colors"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-0">
        <FilterSection
          title="Meal Type"
          items={MEAL_TYPES}
          selected={filters.mealTypes}
          onToggle={toggleMealType}
          sectionKey="mealTypes"
          activeCount={filters.mealTypes.length}
        />
        <FilterSection
          title="Dietary"
          items={DIETARY_FLAGS}
          selected={filters.dietaryFlags}
          onToggle={toggleDietary}
          sectionKey="dietary"
          activeCount={filters.dietaryFlags.length}
        />
        <FilterSection
          title="Cooking Method"
          items={COOKING_STYLES}
          selected={filters.cookingStyles}
          onToggle={toggleCooking}
          sectionKey="cooking"
          activeCount={filters.cookingStyles.length}
        />
      </div>
    </div>
  )
}
