import {
  Users,
  AlertTriangle,
  Wifi,
  CheckCircle,
  Activity,
  Heart
} from 'lucide-react'

interface StatsCardsProps {
  totalPatients: number
  totalCaregivers: number
  totalDevices: number
  totalEvents: number
  activeEmergencies: number
  offlineDevices: number
  completedCheckins: number
}

export function StatsCards({
  totalPatients,
  totalCaregivers,
  totalDevices,
  totalEvents,
  activeEmergencies,
  offlineDevices,
  completedCheckins
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Caregivers',
      value: totalCaregivers,
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/20',
      textColor: 'text-pink-600 dark:text-pink-400',
      iconColor: 'text-pink-500'
    },
    {
      title: 'Active Devices',
      value: totalDevices - offlineDevices,
      subtitle: `of ${totalDevices} total`,
      icon: Wifi,
      gradient: 'from-emerald-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    {
      title: 'Active Emergencies',
      value: activeEmergencies,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500',
      pulse: activeEmergencies > 0
    },
    {
      title: "Today's Check-ins",
      value: completedCheckins,
      icon: CheckCircle,
      gradient: 'from-violet-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20',
      textColor: 'text-violet-600 dark:text-violet-400',
      iconColor: 'text-violet-500'
    },
    {
      title: 'Total Events',
      value: totalEvents,
      icon: Activity,
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={`${stat.bgColor} rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-sm`}>
                  <Icon className={`w-5 h-5 text-white`} strokeWidth={2} />
                </div>
                {stat.pulse && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
