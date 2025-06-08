// components/editor/EditorToolbar.jsx
import React from 'react'
import { Tooltip } from '@radix-ui/react-tooltip' // Or use your preferred tooltip

export function EditorToolbar({ buttons }) {
    return (
        <div className="flex space-x-1 rounded-md bg-gray-100 px-2 py-1">
            {buttons.map((btn, index) => (
                <button
                    key={index}
                    onClick={btn.action}
                    className="p-2 rounded hover:bg-gray-200 text-gray-700 transition"
                    title={btn.tooltip}
                    type="button"
                >
                    <btn.icon className="w-4 h-4" />
                </button>
            ))}
        </div>
    )
}

