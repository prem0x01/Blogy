import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/context/AuthContext'

export function FollowButton({
  userId,
  initialIsFollowing = false,
  size = 'default',
  className = '',
  onFollowChange
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { user, openAuthModal } = useAuth()
  const { toast } = useToast()

  // Sync with prop changes
  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  const handleFollow = async () => {
    if (!user) {
      openAuthModal('login')
      return
    }

    if (user.id === userId) {
      toast({
        title: "Cannot follow yourself",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Optimistic update
      setIsFollowing(prev => !prev)
      onFollowChange?.(!isFollowing)

      // Here you would make the API call to follow/unfollow
      // await api.post(`/users/${userId}/follow`)
      
      toast({
        title: isFollowing ? "Unfollowed user" : "Following user",
        duration: 2000
      })
    } catch (error) {
      // Revert on error
      setIsFollowing(prev => !prev)
      onFollowChange?.(isFollowing)
      
      toast({
        title: "Action failed",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSizes = {
    sm: 'px-3 py-1 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      className={`relative ${buttonSizes[size]} ${className}`}
      onClick={handleFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
            {size !== 'sm' && "Loading..."}
          </motion.span>
        ) : (
          <motion.span
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {isFollowing ? (
              <>
                <UserMinus className={iconSizes[size]} />
                {size !== 'sm' && (isHovered ? 'Unfollow' : 'Following')}
              </>
            ) : (
              <>
                <UserPlus className={iconSizes[size]} />
                {size !== 'sm' && 'Follow'}
              </>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}

// Wrapper with hover tooltip
export function FollowButtonWithTooltip(props) {
  return (
    <div className="group relative">
      <FollowButton {...props} />
      <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 transform rounded bg-background px-2 py-1 text-xs shadow-lg group-hover:block">
        {props.initialIsFollowing ? 'Unfollow user' : 'Follow user'}
      </div>
    </div>
  )
}