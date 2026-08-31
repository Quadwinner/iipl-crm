import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rental-admin/components/ui/tabs'
import { cn } from '@rental-admin/lib/utils'

export interface DetailTab {
  id: string
  label: string
  content: ReactNode
}

interface DetailTabsProps {
  tabs: DetailTab[]
  defaultValue?: string
  className?: string
}

export function DetailTabs({ tabs, defaultValue, className }: DetailTabsProps) {
  if (tabs.length === 0) return null

  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.id} className={cn('gap-4', className)}>
      <TabsList className="h-auto w-full flex-wrap justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="outline-none">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
