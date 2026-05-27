const COLOR_MAP: Record<string, string> = {
  'bg-red-500': '#EF4444',
  'bg-orange-500': '#F97316',
  'bg-yellow-500': '#EAB308',
  'bg-green-500': '#22C55E',
  'bg-teal-500': '#14B8A6',
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-purple-500': '#A855F7',
  'bg-pink-500': '#EC4899',
  'bg-rose-500': '#F43F5E',
  'bg-slate-500': '#64748B',
  'bg-gray-500': '#6B7280',
}

export function getColorFromClass(colorClass: string): string {
  if (colorClass.startsWith('#')) return colorClass

  if (colorClass.startsWith('bg-[#') && colorClass.includes(']')) {
    const hexMatch = colorClass.match(/#[0-9A-Fa-f]{6}/)
    return hexMatch?.[0] ?? '#6B7280'
  }

  for (const [className, hexColor] of Object.entries(COLOR_MAP)) {
    if (colorClass.includes(className)) return hexColor
  }

  return '#6B7280'
}
