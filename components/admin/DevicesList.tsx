'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, Battery, User } from 'lucide-react'

interface DevicesListProps {
  devices: Array<{
    mac_address: string
    health: string
    battery_level: number
    state: string
    patient_id: string
    patients?: { id: string; name: string }
  }>
}

export function DevicesList({ devices }: DevicesListProps) {
  const getHealthBadge = (health: string) => {
    if (health === 'ONLINE') {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ONLINE
        </span>
      )
    }
    return (
      <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        OFFLINE
      </span>
    )
  }

  const getBatteryColor = (level: number) => {
    if (level > 66) return 'text-green-500'
    if (level > 33) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getBatteryBackground = (level: number) => {
    if (level > 66) return 'bg-green-500'
    if (level > 33) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (devices.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500" />
            Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Wifi className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No devices found</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/20">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-emerald-500" />
          Devices ({devices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MAC Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {devices.map((device) => (
                <tr
                  key={device.mac_address}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      {device.mac_address}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getHealthBadge(device.health)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.battery_level)}`} />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {device.battery_level}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBatteryBackground(device.battery_level)}`}
                          style={{ width: `${device.battery_level}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {device.state.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800 dark:text-gray-200">
                        {device.patients?.name || 'Unassigned'}
                      </span>
                    </div>
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
