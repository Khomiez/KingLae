'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MapPin, Ruler, Weight, Activity, MessageSquare } from 'lucide-react'

interface PatientsListProps {
  patients: Array<{
    id: string
    name: string
    date_of_birth?: string
    weight?: number
    height?: number
    symptoms?: string[]
    address?: string
    relative_line_id?: string
  }>
}

export function PatientsList({ patients }: PatientsListProps) {
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} years`
  }

  if (patients.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Patients
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

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Patients ({patients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Height
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  Symptoms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden 2xl:table-cell">
                  Relative LINE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {patients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold ${
                        index === 0 ? 'from-blue-400 to-indigo-500' :
                        index === 1 ? 'from-indigo-400 to-purple-500' :
                        index === 2 ? 'from-purple-400 to-pink-500' :
                        'from-gray-400 to-gray-500'
                      }`}>
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {calculateAge(patient.date_of_birth)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Weight className="w-4 h-4" />
                      <span>{patient.weight ? `${patient.weight} kg` : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Ruler className="w-4 h-4" />
                      <span>{patient.height ? `${patient.height} cm` : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    {patient.symptoms && patient.symptoms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.symptoms.slice(0, 2).map((symptom, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          >
                            <Activity className="w-3 h-3" />
                            {symptom}
                          </span>
                        ))}
                        {patient.symptoms.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{patient.symptoms.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    {patient.address ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden 2xl:table-cell">
                    {patient.relative_line_id ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-mono">{patient.relative_line_id}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
