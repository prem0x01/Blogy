import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '../common/Button'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'

export function LikeButton({ 
  postId, 
  initialLikes = 0, 
  initialLiked = false,
  size = 'default',
  showCount = true,
  className = '' 
}) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [isAnimating, setIsAnimating] = useState(false)
  const { user, openAuthModal } = useAuth()

  // Sync with prop changes
  useEffect(() => {
    setLikes(initialLikes)
    setIsLiked(initialLiked)
  }, [initialLikes, initialLiked])

  const handleLike = async () => {
    if (!user) {
      openAuthModal('login')
      return
    }

    // Optimistic update
    setIsLiked(prev => !prev)
    setLikes(prev => prev + (isLiked ? -1 : 1))
    setIsAnimating(true)

    try {
      const response = await api.post(`/posts/${postId}/like`)
      // Update with actual server data
      setLikes(response.data.likes)
      setIsLiked(response.data.isLiked)
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(prev => !prev)
      setLikes(prev => prev + (isLiked ? 1 : -1))
      toast.error('Failed to update like status')
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const buttonSizes = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const countSizes = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className={`group relative ${buttonSizes[size]}`}
        onClick={handleLike}
      >
        <AnimatePresence>
          {/* Background heart */}
          <motion.span
            className={`absolute ${iconSizes[size]} text-muted-foreground transition-colors group-hover:text-red-500`}
          >
            <Heart />
          </motion.span>

          {/* Filled heart */}
          {isLiked && (
            <motion.span
              className={`absolute ${iconSizes[size]} text-red-500`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart className="fill-current" />
            </motion.span>
          )}

          {/* Animation particles */}
          {isAnimating && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-red-500"
                  initial={{
                    opacity: 1,
                    x: 0,
                    y: 0
                  }}
                  animate={{
                    opacity: 0,
                    x: Math.cos((i * Math.PI) / 3) * 20,
                    y: Math.sin((i * Math.PI) / 3) * 20
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </Button>

      {/* Like count */}
      {showCount && (
        <AnimatePresence mode="wait">
          <motion.span
            key={likes}
            className={`${countSizes[size]} font-medium ${
              isLiked ? 'text-red-500' : 'text-muted-foreground'
            }`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {likes.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  )
}

// Tooltip wrapper component
function LikeButtonWithTooltip(props) {
  return (
    <div className="group relative">
      <LikeButton {...props} />
      <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 transform rounded bg-background px-2 py-1 text-xs shadow-lg group-hover:block">
        {props.initialLiked ? 'Unlike' : 'Like'}
      </div>
    </div>
  )
}

export { LikeButton, LikeButtonWithTooltip }
