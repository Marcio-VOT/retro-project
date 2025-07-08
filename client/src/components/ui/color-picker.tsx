"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

const predefinedColors = [
  { name: 'Gray', value: '#6B7280', bgClass: 'bg-gray-500 text-white' },
  { name: 'Red', value: '#EF4444', bgClass: 'bg-red-500 text-white' },
  { name: 'Orange', value: '#F97316', bgClass: 'bg-orange-500 text-white' },
  { name: 'Yellow', value: '#EAB308', bgClass: 'bg-yellow-500 text-black' },
  { name: 'Green', value: '#22C55E', bgClass: 'bg-green-500 text-white' },
  { name: 'Teal', value: '#14B8A6', bgClass: 'bg-teal-500 text-white' },
  { name: 'Blue', value: '#3B82F6', bgClass: 'bg-blue-500 text-white' },
  { name: 'Indigo', value: '#6366F1', bgClass: 'bg-indigo-500 text-white' },
  { name: 'Purple', value: '#A855F7', bgClass: 'bg-purple-500 text-white' },
  { name: 'Pink', value: '#EC4899', bgClass: 'bg-pink-500 text-white' },
  { name: 'Rose', value: '#F43F5E', bgClass: 'bg-rose-500 text-white' },
  { name: 'Slate', value: '#64748B', bgClass: 'bg-slate-500 text-white' }
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  // Find the selected color by matching the bgClass or extracting hex from custom colors
  const selectedColor = predefinedColors.find(color => color.bgClass === value) || 
    (value.startsWith('bg-[#') ? { 
      name: 'Custom', 
      value: value.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#000000',
      bgClass: value 
    } : null)

  const handleColorSelect = (color: typeof predefinedColors[0]) => {
    onChange(color.bgClass)
    setOpen(false)
  }

  const handleCustomColorChange = (hexColor: string) => {
    setCustomColor(hexColor)
    // Convert hex to Tailwind-like classes (simplified)
    const bgClass = `bg-[${hexColor}] text-white`
    onChange(bgClass)
  }

  // Get the display color for the preview
  const getDisplayColor = () => {
    if (selectedColor) {
      return selectedColor.value
    }
    // Extract hex from custom bg-[#hex] format
    const hexMatch = value.match(/#[0-9A-Fa-f]{6}/)
    if (hexMatch) {
      return hexMatch[0]
    }
    return '#000000'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedColor && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded border"
              style={{ 
                backgroundColor: getDisplayColor(),
                borderColor: 'var(--border)'
              }}
            />
            <span>{selectedColor?.name || 'Custom Color'}</span>
            <Palette className="ml-auto h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Predefined Colors</h4>
            <div className="grid grid-cols-6 gap-2">
              {predefinedColors.map((color) => (
                <Button
                  key={color.name}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 relative"
                  onClick={() => handleColorSelect(color)}
                >
                  <div 
                    className="w-full h-full rounded"
                    style={{ backgroundColor: color.value }}
                  />
                  {selectedColor?.bgClass === color.bgClass && (
                    <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Custom Color</h4>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={getDisplayColor()}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                type="text"
                value={getDisplayColor()}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 