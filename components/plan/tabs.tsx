'use client'

import { useState } from 'react'

interface TabsProps {
  children: React.ReactElement[]
  labels: string[]
}

export function Tabs({ children, labels }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 flex justify-center space-x-2">
        {labels.map((label, index) => (
          <button
            key={index}
            className={`rounded-full px-6 py-3 text-lg font-semibold transition-colors ${
              activeTab === index
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {label}
          </button>
        ))}
      </div>
      {children[activeTab]}
    </div>
  )
}
