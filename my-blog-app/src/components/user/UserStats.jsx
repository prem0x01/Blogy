import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function UserStats({
  followers = [],
  following = [],
  posts = [],
  className = ''
}) {
  const [activeCard, setActiveCard] = useState(null)
  
  const stats = [
    {
      label: 'Posts',
      value: posts.length,
      users: null
    },
    {
      label: 'Followers',
      value: followers.length,
      users: followers
    },
    {
      label: 'Following',
      value: following.length,
      users: following
    }
  ]

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num
  }

  return (
    <div className={`flex gap-6 ${className}`}>
      {stats.map((stat) => (
        <HoverCard
          key={stat.label}
          open={activeCard === stat.label}
          onOpenChange={(open) => setActiveCard(open ? stat.label : null)}
        >
          <HoverCardTrigger asChild>
            <motion.button
              className="flex flex-col items-center"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <span className="text-2xl font-bold">
                {formatNumber(stat.value)}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </motion.button>
          </HoverCardTrigger>

          {stat.users && (
            <HoverCardContent 
              side="top" 
              className="w-64 p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <ScrollArea className="h-64">
                <div className="p-4">
                  <h4 className="mb-4 text-sm font-medium">
                    {stat.label}
                  </h4>
                  <AnimatePresence>
                    {stat.users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </HoverCardContent>
          )}
        </HoverCard>
      ))}
    </div>
  )
}

// Optional compact version
export function UserStatsCompact({ followers, following, posts }) {
  return (
    <div className="flex divide-x text-center">
      {[
        { label: 'Posts', value: posts.length },
        { label: 'Followers', value: followers.length },
        { label: 'Following', value: following.length }
      ].map((stat) => (
        <div key={stat.label} className="flex-1 px-4">
          <div className="text-lg font-semibold">
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}