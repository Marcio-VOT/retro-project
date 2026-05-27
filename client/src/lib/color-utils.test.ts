import { describe, it, expect } from 'vitest'
import { getColorFromClass } from './color-utils'

describe('getColorFromClass', () => {
  it('returns hex directly if input already starts with #', () => {
    expect(getColorFromClass('#FF0000')).toBe('#FF0000')
  })

  it('maps known Tailwind bg class to hex', () => {
    expect(getColorFromClass('bg-blue-500')).toBe('#3B82F6')
    expect(getColorFromClass('bg-green-500')).toBe('#22C55E')
  })

  it('extracts hex from bg-[#hex] custom class', () => {
    expect(getColorFromClass('bg-[#1A2B3C]')).toBe('#1A2B3C')
  })

  it('returns fallback for unknown class', () => {
    expect(getColorFromClass('bg-unknown-999')).toBe('#6B7280')
  })
})
