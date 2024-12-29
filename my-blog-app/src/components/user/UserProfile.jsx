import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  MapPin, 
  Link2, 
  Twitter, 
  Github,
  Settings,
  Grid,
  BookOpen
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FollowButton } from './FollowButton'
import { UserStats } from './UserStats'
import { useAuth } from '@/context/AuthContext'

export function UserProfile({
  user = {},
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('posts')
  const { user: currentUser } = useAuth()
  const isOwnProfile = currentUser?.id === user.id

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  }

  const socialLinks = [
    { icon: Twitter, url: user.twitter },
    { icon: Github, url: user.github },
    { icon: Link2, url: user.website }
  ].filter(link => link.url)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
        {user.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6">
        {/* Avatar */}
        <div className="absolute -top-16 flex items-end gap-4">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="mb-4 flex gap-2">
            {isOwnProfile ? (
              <Button variant="outline" asChild>
                <a href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </a>
              </Button>
            ) : (
              <FollowButton
                userId={user.id}
                initialIsFollowing={user.isFollowing}
              />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-20 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-sm leading-loose">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
            )}
            {user.joinDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.joinDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, url }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-2 hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          {/* User Stats */}
          <UserStats
            followers={user.followers}
            following={user.following}
            posts={user.posts}
          />
        </div>

        {/* Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Likes
            </TabsTrigger>
          </TabsList>
          
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="posts" className="mt-6">
              {user.posts?.length > 0 ? (
                <div className="grid gap-4">
                  {/* Render post list */}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No posts yet
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="likes" className="mt-6">
              {user.likes?.length > 0 ? (
                <div className="grid gap-4">
                  {/* Render liked posts */}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No liked posts
                </div>
              )}
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  )
}