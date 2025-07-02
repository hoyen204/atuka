'use client'

import { useState } from 'react'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Chọn ngày", className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}

interface PeriodSelectorProps {
  value: string
  onChange: (period: string) => void
  className?: string
}

export function PeriodSelector({ value, onChange, className = "" }: PeriodSelectorProps) {
  const periods = [
    { value: 'day', label: 'Ngày' },
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' }
  ]

  return (
    <div className={`flex space-x-1 bg-gray-100 rounded-md p-1 ${className}`}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === period.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}

interface FilterSelectProps {
  value?: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
}

export function FilterSelect({ value, onChange, options, placeholder = "Chọn...", className = "" }: FilterSelectProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
} 