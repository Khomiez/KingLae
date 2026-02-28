'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, WifiOff, AlertCircle, Zap } from 'lucide-react'

interface DeviceHealthChartProps {
  deviceHealthDistribution: Record<string, number>
}

const HEALTH_CONFIG: Record<string, { label: string; color: string }> = {
  'ONLINE': { label: 'Online', color: '#10b981' },
  'OFFLINE': { label: 'Offline', color: '#ef4444' },
  'LOW_BATTERY': { label: 'Low Battery', color: '#f59e0b' },
  'MAINTENANCE': { label: 'Maintenance', color: '#8b5cf6' }
}

export function DeviceHealthChart({ deviceHealthDistribution }: DeviceHealthChartProps) {
  const data = Object.entries(deviceHealthDistribution)
    .map(([health, count]) => ({
      name: HEALTH_CONFIG[health]?.label || health.charAt(0) + health.slice(1).toLowerCase().replace('_', ' '),
      value: count,
      color: HEALTH_CONFIG[health]?.color || '#6b7280'
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500" />
            Device Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <WifiOff className="w-16 h-16 mx-auto mb-3 opacity-50" />
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
          <Wifi className="w-5 h-5 text-emerald-500" />
          Device Health Status
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
