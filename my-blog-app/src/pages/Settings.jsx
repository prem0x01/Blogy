import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { toast } from '../utils/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/common/Input'

export default function Settings() {
  const { user, logout } = useAuth()
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== newPassword || newPassword !== confirmNewPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' })
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/users/settings', {
        email,
        password,
        newPassword
      })
      const { token } = response.data
      await logout()
      await api.post('/auth/login', { email, password: newPassword })
      toast({ variant: 'success', title: 'Success', description: 'Settings updated.' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Current Password
          </label>
          <Input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your current password"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
            New Password
          </label>
          <Input
            type="password"
            id="new-password"
            name="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
          />
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <Input
            type="password"
            id="confirm-new-password"
            name="confirm-new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Enter your new password again"
          />
        </div>

        <Button type="submit" loading={loading}>
          Update Settings
        </Button>
      </form>
    </div>
  )
}
