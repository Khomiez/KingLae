'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EventStatusChartProps {
  eventStatuses: Array<{ status: string }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'PENDING': { label: 'Pending', color: '#f59e0b' },
  'ACTIVE': { label: 'Active', color: '#ef4444' },
  'ACKNOWLEDGED': { label: 'Acknowledged', color: '#f97316' },
  'RESOLVED': { label: 'Resolved', color: '#10b981' },
  'CANCELLED': { label: 'Cancelled', color: '#6b7280' }
}

export function EventStatusChart({ eventStatuses }: EventStatusChartProps) {
  const distribution = eventStatuses.reduce((acc, event) => {
    const status = event.status || 'UNKNOWN'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(distribution)
    .map(([status, count]) => ({
      status: STATUS_CONFIG[status]?.label || status.charAt(0) + status.slice(1).toLowerCase(),
      count,
      color: STATUS_CONFIG[status]?.color || '#6b7280'
    }))
    .sort((a, b) => b.count - a.count)

  if (data.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Event Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No events recorded yet</p>
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
          <p className="font-semibold text-gray-800 dark:text-gray-200">{payload[0].payload.status}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{payload[0].value} events</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Events by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis
              dataKey="status"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
