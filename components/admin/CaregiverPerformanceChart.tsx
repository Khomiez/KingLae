'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Award } from 'lucide-react'

interface CaregiverPerformanceChartProps {
  caregivers: Array<{
    id: string
    name: string
    resolvedEvents: number
    avgResponseTime: number
  }>
}

export function CaregiverPerformanceChart({ caregivers }: CaregiverPerformanceChartProps) {
  const data = caregivers
    .map(c => ({
      name: c.name.split(' ')[0], // First name only
      resolved: c.resolvedEvents,
      responseTime: c.avgResponseTime
    }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 8) // Top 8 caregivers

  if (data.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Award className="w-5 h-5 text-pink-500" />
            Caregiver Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No caregivers found</p>
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
          <p className="font-semibold text-gray-800 dark:text-gray-200">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{payload[0].value} resolved events</p>
          {payload[1] && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg response: {payload[1].value} min</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Award className="w-5 h-5 text-pink-500" />
          Caregiver Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#9ca3af" />
            <YAxis
              dataKey="name"
              type="category"
              width={80}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar dataKey="resolved" fill="#ec4899" radius={[0, 8, 8, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${330 + index * 5}, 80%, ${55 + index * 2}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
