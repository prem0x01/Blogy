import { useState, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditorToolbar } from './EditorToolbar'
import { Preview } from './Preview'
import { AIAssistant } from './AIAssistant'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image,
  Link,
  Code,
  Quote,
  SplitSquareHorizontal,
  Wand2
} from 'lucide-react'

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className = ''
}) {
  const [showAI, setShowAI] = useState(false)
  const [view, setView] = useState('edit') // 'edit' | 'split' | 'preview'
  const editorRef = useRef(null)

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`
    const newCursorPos = start + prefix.length + selectedText.length + suffix.length

    onChange?.(newText)
    
    // Reset cursor position after React rerender
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleAISuggestion = (suggestion) => {
    const newText = value + (value ? '\n\n' : '') + suggestion
    onChange?.(newText)
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), tooltip: 'Italic (Ctrl+I)' },
    { icon: List, action: () => insertMarkdown('\n- '), tooltip: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. '), tooltip: 'Numbered List' },
    { icon: Image, action: () => insertMarkdown('![Alt text](', ')'), tooltip: 'Image' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), tooltip: 'Link' },
    { icon: Code, action: () => insertMarkdown('`', '`'), tooltip: 'Inline Code' },
    { icon: Quote, action: () => insertMarkdown('\n> '), tooltip: 'Quote' }
  ]

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          insertMarkdown('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertMarkdown('*', '*')
          break
      }
    }
  }

  return (
    <div className={`flex h-full flex-col gap-4 ${className}`}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <EditorToolbar buttons={toolbarButtons} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAI(prev => !prev)}
            className="relative"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView(view === 'split' ? 'edit' : 'split')}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="relative flex flex-1 gap-4">
        <div className={view === 'preview' ? 'hidden' : 'flex-1'}>
          <ScrollArea className="h-full">
            <textarea
              ref={editorRef}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[500px] w-full resize-none bg-transparent p-4 font-mono focus:outline-none"
            />
          </ScrollArea>
        </div>

        {(view === 'split' || view === 'preview') && (
          <div className="flex-1">
            <Preview content={value} />
          </div>
        )}

        {/* AI Assistant Sidebar */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="absolute right-0 top-0 h-full"
            >
              <AIAssistant
                onSuggestion={handleAISuggestion}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}