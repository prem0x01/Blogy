import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { toast } from '../utils/toast'
import { FollowButton } from '../components/user/FollowButton'
import { UserStats } from '../components/user/UserStats'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'

export default function UserProfile() {
  const { userId } = useParams()
  const { user, openAuthModal } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${userId}`)
        setProfile(response.data)
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch user profile.' })
      }
    }

    fetchProfile()
  }, [userId])

  if (!profile) return null

  const isCurrentUser = user?.id === profile.id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback>{profile.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>
      <UserStats userId={profile.id} />
      {!isCurrentUser && (
        <FollowButton
          userId={profile.id}
          initialIsFollowing={profile.isFollowing}
          onFollowChange={async (isFollowing) => {
            try {
              if (isFollowing) {
                await api.post(`/users/${profile.id}/follow`)
              } else {
                await api.delete(`/users/${profile.id}/follow`)
              }
              setProfile((prev) => ({ ...prev, isFollowing }))
            } catch (error) {
              toast({
                title: 'Error',
                description: 'Failed to follow/unfollow user.',
              })
            }
          }}
        />
      )}
      {isCurrentUser && (
        <Button variant="outline" onClick={() => openAuthModal('settings')}>
          Edit Profile
        </Button>
      )}
    </div>
  )
}
