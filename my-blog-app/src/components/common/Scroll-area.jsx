// components/ui/scroll-area.jsx
import React from 'react'

export function ScrollArea({ children, className = '' }) {
    return (
        <div
            className={`overflow-auto custom-scrollbar ${className}`}
        >
            {children}
        </div>
    )
}

