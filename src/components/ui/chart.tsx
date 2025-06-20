'use client'

import { ReactNode } from 'react'

interface ChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title?: string
  type?: 'bar' | 'line' | 'pie'
  height?: number
  className?: string
}

export function Chart({ data, title, type = 'bar', height = 300, className }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          Không có dữ liệu
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))

  const BarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-right truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                item.color || 'bg-blue-500'
              }`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="absolute right-2 top-0 h-full flex items-center text-xs font-medium text-gray-700">
              {item.value.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  const LineChart = () => (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 400 200">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 380 + 10
          const y = 190 - (item.value / maxValue) * 180
          const nextItem = data[index + 1]
          
          return (
            <g key={index}>
              {nextItem && (
                <line
                  x1={x}
                  y1={y}
                  x2={(index + 1) / (data.length - 1) * 380 + 10}
                  y2={190 - (nextItem.value / maxValue) * 180}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="hover:r-6 cursor-pointer"
              />
              <text
                x={x}
                y="200"
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )

  const PieChart = () => {
    let cumulativePercentage = 0
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
    
    return (
      <div className="flex items-center space-x-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100
              const strokeDasharray = `${percentage} ${100 - percentage}`
              const strokeDashoffset = -cumulativePercentage
              const color = colors[index % colors.length]
              
              cumulativePercentage += percentage
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="16"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{item.label}: {item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div style={{ height }}>
        {type === 'bar' && <BarChart />}
        {type === 'line' && <LineChart />}
        {type === 'pie' && <PieChart />}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: string | number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: ReactNode
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`text-sm flex items-center mt-1 ${
              change.type === 'increase' ? 'text-green-600' :
              change.type === 'decrease' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change.type === 'increase' && '↗'}
              {change.type === 'decrease' && '↘'}
              {change.type === 'neutral' && '→'}
              <span className="ml-1">{change.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
} 