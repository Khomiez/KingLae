'use client'

import * as React from 'react'

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: '',
  onValueChange: () => {},
})

const Tabs = React.forwardRef<
  HTMLDivElement,
  {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
    className?: string
  }
>(({ value, onValueChange, children, className = '' }, ref) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div ref={ref} className={className}>
      {children}
    </div>
  </TabsContext.Provider>
))
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className = '' }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}
  >
    {children}
  </div>
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  { value: string; children: React.ReactNode; className?: string }
>(({ value, children, className = '' }, ref) => {
  const context = React.useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      } ${className}`}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  HTMLDivElement,
  { value: string; children: React.ReactNode; className?: string }
>(({ value, children, className = '' }, ref) => {
  const context = React.useContext(TabsContext)

  if (context.value !== value) return null

  return (
    <div ref={ref} className={`mt-4 focus:outline-none ${className}`}>
      {children}
    </div>
  )
})
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
