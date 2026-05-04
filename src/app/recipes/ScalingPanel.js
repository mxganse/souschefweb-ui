'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  parseMarkdownIngredients,
  parseIngredient,
  parseYield,
  formatIngredient,
  ingredientRatios,
  formatQuantity,
} from '@/lib/ingredients'

export default function ScalingPanel({ markdown, onScaleChange }) {
  function track(event, metadata = {}) {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, metadata }),
    }).catch(() => {})
  }

  const [mode, setMode]               = useState('multiply')
  const [multiplier, setMultiplier]   = useState('1')
  const [targetYield, setTargetYield] = useState('')
  const [keyIngredient, setKeyIngredient] = useState('')
  const [keyAmount, setKeyAmount]     = useState('')
  const [unitSystem, setUnitSystem]   = useState('auto')
  const [showBakers, setShowBakers]   = useState(false)
  const [baseIngredient, setBaseIngredient] = useState('')

  const parsedIngredients = useMemo(
    () => parseMarkdownIngredients(markdown).map(parseIngredient),
    [markdown]
  )

  const yieldInfo = useMemo(() => parseYield(markdown), [markdown])

  const scaleFactor = useMemo(() => {
    if (mode === 'multiply') {
      return Math.max(0.01, parseFloat(multiplier) || 1)
    }
    if (mode === 'yield') {
      if (!yieldInfo || !yieldInfo.amount || yieldInfo.amount === 0) return 1
      const target = parseFloat(targetYield)
      if (!target || target === 0) return 1
      return target / yieldInfo.amount
    }
    if (mode === 'key') {
      const match = parsedIngredients.find(p => p.name === keyIngredient)
      if (!match || match.quantity === null || match.quantity === 0) return 1
      const amt = parseFloat(keyAmount)
      if (!amt || amt === 0) return 1
      return amt / match.quantity
    }
    return 1
  }, [mode, multiplier, targetYield, keyIngredient, keyAmount, yieldInfo, parsedIngredients])

  useEffect(() => {
    onScaleChange?.({ factor: scaleFactor, system: unitSystem })
  }, [scaleFactor, unitSystem, onScaleChange])

  useEffect(() => {
    if (!baseIngredient && parsedIngredients.length > 0) {
      const flour = parsedIngredients.find(p => p.name?.toLowerCase().includes('flour') && p.quantity !== null)
      if (flour) setBaseIngredient(flour.name)
    }
  }, [parsedIngredients, baseIngredient])

  const ratioData = useMemo(
    () => (showBakers && baseIngredient ? ingredientRatios(parsedIngredients, baseIngredient) : []),
    [showBakers, baseIngredient, parsedIngredients]
  )

  const UNIT_SYSTEMS = [
    { id: 'auto',     label: 'Auto' },
    { id: 'metric',   label: 'Metric' },
    { id: 'imperial', label: 'Imperial' },
  ]

  const MODES = [
    { id: 'multiply', label: '× Multiply' },
    { id: 'yield',    label: '🎯 Target Yield' },
    { id: 'key',      label: '🔑 Key Ingredient' },
  ]

  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-4 bg-[#0E1117]">

      {/* Row 1 — Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">⚖ SCALE RECIPE</span>
        <div className="flex items-center gap-1">
          {UNIT_SYSTEMS.map(u => (
            <button
              key={u.id}
              onClick={() => setUnitSystem(u.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                unitSystem === u.id
                  ? 'bg-[#D35400] text-white border border-[#D35400]'
                  : 'border border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 — Mode tabs */}
      <div className="flex border-b border-gray-800">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { if (m.id !== 'multiply') track('scale_mode_' + m.id); setMode(m.id) }}
            className={`flex-1 text-xs font-bold py-2 text-center transition-colors border-b-2 ${
              mode === m.id
                ? 'border-[#D35400] text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Row 3 — Mode controls */}
      {mode === 'multiply' && (
        <div className="flex items-center gap-2 flex-wrap">
          {[0.5, 1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setMultiplier(String(p))}
              className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
                parseFloat(multiplier) === p
                  ? 'bg-[#D35400] border-[#D35400] text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {p === 0.5 ? '÷ 2' : `× ${p}`}
            </button>
          ))}
          <span className="text-xs text-gray-600 ml-1">or</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={multiplier}
            onChange={e => setMultiplier(e.target.value)}
            className="w-20 bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#D35400]"
          />
          <span className="text-xs text-gray-500">×</span>
        </div>
      )}

      {mode === 'yield' && (
        <div className="space-y-2">
          {yieldInfo
            ? <p className="text-xs text-gray-500">Original: <span className="text-gray-300">{yieldInfo.label}</span></p>
            : <p className="text-xs text-gray-600 italic">Yield not found in recipe — enter target manually</p>
          }
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Target:</span>
            <input
              type="number"
              min="1"
              step="1"
              value={targetYield}
              onChange={e => setTargetYield(e.target.value)}
              placeholder={yieldInfo ? String(yieldInfo.amount) : ''}
              className="w-24 bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#D35400]"
            />
            <span className="text-xs text-gray-500">
              {yieldInfo?.label?.replace(/^[\d.]+\s*/, '') || 'servings'}
            </span>
          </div>
        </div>
      )}

      {mode === 'key' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">Ingredient:</span>
            <select
              value={keyIngredient}
              onChange={e => setKeyIngredient(e.target.value)}
              className="flex-1 bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#D35400]"
            >
              <option value="">— select —</option>
              {parsedIngredients.filter(p => p.quantity !== null).map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">I have:</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={keyAmount}
              onChange={e => setKeyAmount(e.target.value)}
              placeholder="amount"
              className="w-24 bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#D35400]"
            />
            <span className="text-xs text-gray-500">
              {parsedIngredients.find(p => p.name === keyIngredient)?.unit || ''}
            </span>
          </div>
        </div>
      )}

      {/* Row 4 — Scale indicator */}
      {Math.abs(scaleFactor - 1) > 0.001 && (
        <p className="text-xs text-[#D35400] font-bold">
          Scaling: {formatQuantity(scaleFactor)}×
        </p>
      )}

      {/* Row 5 — Ingredient list */}
      {parsedIngredients.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No ingredients section found in this recipe.</p>
      ) : (
        <ul className="space-y-1.5">
          {parsedIngredients.map((p, i) => {
            const isScaled = Math.abs(scaleFactor - 1) > 0.001
            const formatted = formatIngredient(p, scaleFactor, unitSystem)
            const canScale = p.quantity !== null
            return (
              <li key={i} className={`text-sm flex items-start gap-2 ${canScale ? '' : 'opacity-50'}`}>
                <span className="text-gray-600 mt-0.5">•</span>
                <span className={canScale && isScaled ? 'text-[#D35400]' : 'text-gray-300'}>
                  {formatted}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Row 6 — Ingredient Ratios */}
      {parsedIngredients.length > 0 && (
        <div className="border-t border-gray-800 pt-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 flex-shrink-0">Base:</span>
            <select
              value={baseIngredient}
              onChange={e => setBaseIngredient(e.target.value)}
              className="flex-1 bg-[#161B22] border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#D35400]"
            >
              <option value="">— select base —</option>
              {parsedIngredients.filter(p => p.quantity !== null).map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowBakers(s => { if (!s) track('ratio_view'); return !s })}
              className="text-xs text-gray-500 hover:text-gray-300 font-bold flex items-center gap-1 transition-colors flex-shrink-0"
            >
              📐 Ratios {showBakers ? '▴' : '▾'}
            </button>
          </div>
          {showBakers && (
            !baseIngredient ? (
              <p className="text-xs text-gray-600 italic">Select a base ingredient to see ratios.</p>
            ) : ratioData.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 text-left">
                    <th className="pb-1 font-medium">Ingredient</th>
                    <th className="pb-1 font-medium text-right">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {ratioData.map((row, i) => (
                    <tr key={i} className={row.name === baseIngredient ? 'text-[#D35400]' : 'text-gray-300'}>
                      <td className="py-1">{row.name}</td>
                      <td className="py-1 text-right font-mono font-bold">{row.display}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-600 italic">Measure ingredients in the same unit family (all weight or all volume) to see ratios.</p>
            )
          )}
        </div>
      )}

    </div>
  )
}
