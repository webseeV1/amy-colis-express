'use client'
import { useRef, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export default function PinInput({ value, onChange, error }: PinInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const digits = value.split('')
    digits[index] = val.slice(-1)
    const newVal = digits.join('').slice(0, 6)
    onChange(newVal)
    if (val && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <div>
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'w-12 h-12 text-center text-xl font-bold rounded-lg border-2 transition-all',
              'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
              value[i] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white',
              error && 'border-red-400 bg-red-50'
            )}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
