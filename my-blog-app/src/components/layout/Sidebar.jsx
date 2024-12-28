import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Compass, 
  Bookmark, 
  Tag, 
  Settings, 
  TrendingUp,
  Users,
  Star
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Trending', href: '/trending', icon: TrendingUp },
    { name: 'Tags', href: '/tags', icon: Tag },
  ]

  const userNavigation = [
    { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { name: 'Following', href: '/following', icon: Users },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const NavItem = ({ href, icon: Icon, name }) => {
    const isActive = location.pathname === href
    
    return (
      <Link
        to={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{name}</span>
      </Link>
    )
  }

  return (
    <div className="hidden border-r bg-background lg:block">
      <div className="flex h-full flex-col gap-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Discover
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} {...item} />
            ))}
          </div>
        </div>
        
        {user && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Library
            </h2>
            <div className="space-y-1">
              {userNavigation.map((item) => (
                <NavItem key={item.name} {...item} />
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-auto px-3 py-2">
          <div className="rounded-lg bg-accent p-4">
            <h3 className="font-semibold">Write a Story</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Share your thoughts with the world.
            </p>
            <Link
              to="/new"
              className="mt-4 block rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Writing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}