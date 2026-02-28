'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Phone, Copy, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const THAILAND_TZ = 'Asia/Bangkok'

interface CaregiversListProps {
  caregivers: Array<{
    id: string
    name: string
    phone?: string
    created_at: string
  }>
}

export function CaregiversList({ caregivers }: CaregiversListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (caregivers.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Caregivers
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

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Caregivers ({caregivers.length})
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
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {caregivers.map((caregiver, index) => (
                <tr
                  key={caregiver.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold ${
                        index === 0 ? 'from-pink-400 to-rose-500' :
                        index === 1 ? 'from-rose-400 to-red-500' :
                        index === 2 ? 'from-red-400 to-pink-500' :
                        'from-gray-400 to-gray-500'
                      }`}>
                        {caregiver.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {caregiver.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {caregiver.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                          {caregiver.phone}
                        </span>
                        <button
                          onClick={() => handleCopyPhone(caregiver.phone!, caregiver.id)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy phone number"
                        >
                          {copiedId === caregiver.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">No phone</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(toZonedTime(new Date(caregiver.created_at), THAILAND_TZ), { addSuffix: true })}
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
