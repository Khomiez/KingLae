'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, AlertTriangle, HelpCircle, Sun } from 'lucide-react'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface EventsTimelineChartProps {
  eventsTimeline: Array<{ created_at: string; event_type: string }>
}

const THAILAND_TZ = 'Asia/Bangkok'

// Simplified event types - only show important ones
const IMPORTANT_EVENT_TYPES = ['SOS', 'ASSIST', 'MORNING_WAKEUP', 'MISSED_CHECKIN']

const EVENT_CONFIG = {
  'SOS': { label: 'SOS', color: '#ef4444', icon: AlertTriangle },
  'ASSIST': { label: 'Assist', color: '#f59e0b', icon: HelpCircle },
  'MORNING_WAKEUP': { label: 'Wake-up', color: '#10b981', icon: Sun },
  'MISSED_CHECKIN': { label: 'Missed', color: '#8b5cf6', icon: HelpCircle }
}

export function EventsTimelineChart({ eventsTimeline }: EventsTimelineChartProps) {
  // Get current time in Thailand timezone
  const nowInThailand = toZonedTime(new Date(), THAILAND_TZ)
  const sevenDaysAgoInThailand = subDays(nowInThailand, 6)
  const last7Days = eachDayOfInterval({ start: sevenDaysAgoInThailand, end: nowInThailand })

  const eventsByDate = eventsTimeline.reduce((acc, event) => {
    const eventDateInThailand = toZonedTime(new Date(event.created_at), THAILAND_TZ)
    const date = format(eventDateInThailand, 'MMM dd')
    const type = event.event_type

    // Only count important event types
    if (IMPORTANT_EVENT_TYPES.includes(type)) {
      if (!acc[date]) {
        acc[date] = { SOS: 0, ASSIST: 0, MORNING_WAKEUP: 0, MISSED_CHECKIN: 0, total: 0 }
      }
      acc[date][type] = (acc[date][type] || 0) + 1
      acc[date].total += 1
    }
    return acc
  }, {} as Record<string, any>)

  const data = last7Days.map((day) => {
    const dateStr = format(day, 'MMM dd')
    return eventsByDate[dateStr] || {
      SOS: 0,
      ASSIST: 0,
      MORNING_WAKEUP: 0,
      MISSED_CHECKIN: 0,
      total: 0
    }
  }).map((d, i) => ({
    date: last7Days[i] ? format(last7Days[i], 'MMM dd') : '',
    ...d
  }))

  const hasData = data.some(d => d.total > 0)

  if (!hasData) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden col-span-full">
        <CardContent className="p-6">
          <div className="h-[280px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No events in the last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{label}</p>
          {payload.map((entry: any) => (
            entry.dataKey !== 'total' && entry.value > 0 && (
              <div key={entry.name} className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {EVENT_CONFIG[entry.dataKey]?.label || entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {entry.value}
                </span>
              </div>
            )
          ))}
          {payload.some((p: any) => p.dataKey === 'total') && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {payload.find((p: any) => p.dataKey === 'total')?.value || 0}
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden col-span-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            {IMPORTANT_EVENT_TYPES.map(type => {
              const config = EVENT_CONFIG[type as keyof typeof EVENT_CONFIG]
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{config.label}</span>
                </div>
              )
            })}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
            <Bar dataKey="SOS" fill={EVENT_CONFIG.SOS.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="ASSIST" fill={EVENT_CONFIG.ASSIST.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="MORNING_WAKEUP" fill={EVENT_CONFIG.MORNING_WAKEUP.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="MISSED_CHECKIN" fill={EVENT_CONFIG.MISSED_CHECKIN.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
