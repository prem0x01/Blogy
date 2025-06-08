
import React, { useState, createContext, useContext } from 'react'

const TabsContext = createContext()

export function Tabs({ defaultValue, children }) {
    const [value, setValue] = useState(defaultValue)
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({ children, className = '' }) {
    return <div className={`flex space-x-2 mb-2 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = '' }) {
    const context = useContext(TabsContext)
    const isActive = context.value === value

    return (
        <button
            onClick={() => context.setValue(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition ${isActive ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                } ${className}`}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, children, className = '' }) {
    const context = useContext(TabsContext)
    if (context.value !== value) return null
    return <div className={className}>{children}</div>
}

