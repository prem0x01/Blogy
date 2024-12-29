import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'


export function TagList({
  tags = [],
  onChange,
  maxTags = 10,
  size = 'default',
  editable = true,
  className = ''
}) {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const handleAddTag = (e) => {
    e?.preventDefault()
    
    const newTag = inputValue.trim().toLowerCase()
    
    if (!newTag) return

    if (tags.length >= maxTags) {
      toast({
        variant: "destructive",
        title: "Tag limit reached",
        description: `Maximum ${maxTags} tags allowed`
      })
      return
    }

    if (tags.includes(newTag)) {
      toast({
        variant: "destructive",
        title: "Tag exists",
        description: "This tag already exists"
      })
      return
    }

    if (newTag.length > 20) {
      toast({
        variant: "destructive",
        title: "Tag too long",
        description: "Tags must be 20 characters or less"
      })
      return
    }

    onChange?.([...tags, newTag])
    setInputValue('')
    setIsAdding(false)
  }

  const handleRemoveTag = (tagToRemove) => {
    onChange?.(tags.filter(tag => tag !== tagToRemove))
  }

  const tagSizes = {
    sm: 'text-xs py-0.5 px-2',
    default: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4'
  }

  const inputSizes = {
    sm: 'h-6 text-xs',
    default: 'h-8 text-sm',
    lg: 'h-10 text-base'
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <AnimatePresence>
        {tags.map(tag => (
          <motion.div
            key={tag}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`
              flex items-center gap-1 rounded-full 
              bg-primary/10 text-primary
              ${tagSizes[size]}
            `}
          >
            <span>{tag}</span>
            {editable && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
              >
                <X className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              </button>
            )}
          </motion.div>
        ))}

        {editable && !isAdding && tags.length < maxTags && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Button
              variant="outline"
              size={size}
              className="rounded-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              <span className="ml-1">Add Tag</span>
            </Button>
          </motion.div>
        )}

        {editable && isAdding && (
          <motion.form
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex gap-2"
            onSubmit={handleAddTag}
          >
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter tag..."
              className={`rounded-full ${inputSizes[size]}`}
              autoFocus
              onBlur={() => {
                if (!inputValue.trim()) {
                  setIsAdding(false)
                }
              }}
              maxLength={20}
            />
            <Button
              type="submit"
              size={size}
              className="rounded-full"
            >
              Add
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// Optional wrapper with tooltip functionality
export function TagListWithTooltip(props) {
  return (
    <div className="group relative">
      <TagList {...props} />
      {props.editable && (
        <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 transform rounded bg-background px-2 py-1 text-xs shadow-lg group-hover:block">
          {props.tags.length}/{props.maxTags} tags used
        </div>
      )}
    </div>
  )
}