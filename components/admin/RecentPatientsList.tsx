'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const THAILAND_TZ = 'Asia/Bangkok'

interface RecentPatientsListProps {
  patients: Array<{
    id: string
    name: string
    created_at: string
    date_of_birth?: string
  }>
}

export function RecentPatientsList({ patients }: RecentPatientsListProps) {
  if (patients.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-500" />
            Recent Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <UserPlus className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No patients found</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teal-500" />
          Recent Patients
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {patients.map((patient, index) => (
            <div
              key={patient.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold ${
                  index === 0 ? 'from-teal-400 to-cyan-500' :
                  index === 1 ? 'from-cyan-400 to-blue-500' :
                  index === 2 ? 'from-blue-400 to-indigo-500' :
                  'from-gray-400 to-gray-500'
                }`}>
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{patient.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years old` : 'Age not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                {formatDistanceToNow(toZonedTime(new Date(patient.created_at), THAILAND_TZ), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
