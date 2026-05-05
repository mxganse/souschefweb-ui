'use client'
import { useState, useEffect } from 'react'

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

const chipBase = 'px-2.5 py-1 text-xs font-bold rounded-full border transition-colors cursor-pointer select-none'
const chipActive = 'bg-[#D35400] border-[#D35400] text-white'
const chipInactive = 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'

export default function CategoryFilter({ filters, onChange }) {
  const [showAllCooking, setShowAllCooking] = useState(false)

  // DEBUG
  useEffect(() => {
    console.log('[CategoryFilter] Mounted with filters:', filters)
  }, [])

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
  const visibleCooking = showAllCooking ? COOKING_STYLES : COOKING_STYLES.slice(0, 6)

  return (
    <div className="space-y-3 pb-4 border-b border-gray-800 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filter by Category</span>
        {hasFilters && (
          <button
            onClick={() => onChange({ mealTypes: [], dietaryFlags: [], cookingStyles: [] })}
            className="text-xs text-[#D35400] hover:text-[#E67E22] font-bold transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Meal Type */}
      <div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Meal Type</p>
        <div className="flex flex-wrap gap-1.5">
          {MEAL_TYPES.map(m => (
            <button
              key={m.id}
              onClick={() => toggleMealType(m.id)}
              className={`${chipBase} ${filters.mealTypes.includes(m.id) ? chipActive : chipInactive}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary */}
      <div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Dietary</p>
        <div className="flex flex-wrap gap-1.5">
          {DIETARY_FLAGS.map(d => (
            <button
              key={d.id}
              onClick={() => toggleDietary(d.id)}
              className={`${chipBase} ${filters.dietaryFlags.includes(d.id) ? chipActive : chipInactive}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cooking Style */}
      <div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Cooking Method</p>
        <div className="flex flex-wrap gap-1.5">
          {visibleCooking.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCooking(c.id)}
              className={`${chipBase} ${filters.cookingStyles.includes(c.id) ? chipActive : chipInactive}`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setShowAllCooking(v => !v)}
            className={`${chipBase} border-gray-800 text-gray-600 hover:text-gray-400`}
          >
            {showAllCooking ? 'Less ▴' : `+${COOKING_STYLES.length - 6} more ▾`}
          </button>
        </div>
      </div>
    </div>
  )
}
