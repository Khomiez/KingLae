'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface PatientAgeDistributionChartProps {
  patientAgeGroups: Record<string, number>
}

const AGE_CONFIG: Record<string, { label: string; color: string }> = {
  '< 60': { label: 'Under 60', color: '#06b6d4' },
  '60-69': { label: '60-69 years', color: '#8b5cf6' },
  '70-79': { label: '70-79 years', color: '#f59e0b' },
  '80+': { label: '80+ years', color: '#ef4444' }
}

export function PatientAgeDistributionChart({ patientAgeGroups }: PatientAgeDistributionChartProps) {
  const data = Object.entries(patientAgeGroups)
    .map(([age, count]) => ({
      name: AGE_CONFIG[age]?.label || age,
      value: count,
      color: AGE_CONFIG[age]?.color || '#6b7280'
    }))
    .sort((a, b) => {
      const order = ['Under 60', '60-69 years', '70-79 years', '80+ years']
      return order.indexOf(a.name) - order.indexOf(b.name)
    })

  if (data.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Patient Age Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No patients found</p>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">{payload[0].value} patients</p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-500" />
          Patient Age Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{total}</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
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
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
