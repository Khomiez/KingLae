'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Battery, BatteryWarning, BatteryFull } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BatteryLevelChartProps {
  batteryLevels: number[]
}

const getBatteryRange = (level: number): string => {
  if (level >= 80) return 'High (80%+)'
  if (level >= 50) return 'Medium (50-79%)'
  if (level >= 20) return 'Low (20-49%)'
  return 'Critical (<20%)'
}

const BATTERY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'High (80%+)': {
    label: 'High (80%+)',
    color: '#10b981',
    gradient: ['#10b981', '#059669']
  },
  'Medium (50-79%)': {
    label: 'Medium (50-79%)',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706']
  },
  'Low (20-49%)': {
    label: 'Low (20-49%)',
    color: '#f97316',
    gradient: ['#f97316', '#ea580c']
  },
  'Critical (<20%)': {
    label: 'Critical (<20%)',
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626']
  }
}

export function BatteryLevelChart({ batteryLevels }: BatteryLevelChartProps) {
  const distribution = batteryLevels.reduce((acc, level) => {
    const range = getBatteryRange(level)
    acc[range] = (acc[range] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(distribution)
    .map(([range, count]) => ({
      name: range,
      value: count,
      color: BATTERY_CONFIG[range]?.color || '#6b7280'
    }))
    .sort((a, b) => {
      const order = ['High (80%+)', 'Medium (50-79%)', 'Low (20-49%)', 'Critical (<20%)']
      return order.indexOf(a.name) - order.indexOf(b.name)
    })

  if (data.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Battery className="w-5 h-5" />
            Device Battery Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <BatteryWarning className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No devices found</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-200">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{payload[0].value} devices</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <BatteryFull className="w-5 h-5 text-emerald-500" />
          Device Battery Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              innerRadius={50}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
