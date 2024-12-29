import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Plus, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { useAI } from '@/context/AIContext'

export function AIAssistant({
  onSuggestion,
  initialPrompt = '',
  className = ''
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialPrompt)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)
  const { generateResponse, suggestions } = useAI()
  const { toast } = useToast()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = {
      id: Date.now(),
      content: input.trim(),
      role: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await generateResponse(input.trim())
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: response,
        role: 'assistant'
      }])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate response. Please try again."
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onSuggestion?.(suggestion)
    setInput(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    setInput('')
  }

  return (
    <div className={`flex h-full flex-col rounded-lg border bg-card p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          disabled={messages.length === 0}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Suggestions */}
      {messages.length === 0 && suggestions?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isTyping}
        />
        <Button type="submit" disabled={!input.trim() || isTyping}>
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}