import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Check, Info } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'react-hot-toast'

export function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()

  // Password strength indicators
  const getPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['red', 'orange', 'yellow', 'green']
  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (getPasswordStrength(formData.password) < 2) {
      newErrors.password = 'Password is too weak'
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await signup(formData)
      toast.success('Account created successfully!')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account')
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">
          Enter your details to create your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          type="text"
          name="username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          leftIcon={<User className="h-4 w-4" />}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full rounded transition-all bg-${strengthColors[passwordStrength-1]}-500`}
                    style={{ width: `${passwordStrength * 25}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {strengthLabels[passwordStrength-1]}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <PasswordRequirement
                  met={formData.password.length >= 8}
                  text="At least 8 characters"
                />
                <PasswordRequirement
                  met={/[A-Z]/.test(formData.password)}
                  text="Contains uppercase letter"
                />
                <PasswordRequirement
                  met={/[0-9]/.test(formData.password)}
                  text="Contains number"
                />
                <PasswordRequirement
                  met={/[^A-Za-z0-9]/.test(formData.password)}
                  text="Contains special character"
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          leftIcon={<Lock className="h-4 w-4" />}
        />

        {Object.keys(errors).length > 0 && (
          <div className="rounded-md bg-destructive/15 p-3">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  There were errors with your submission
                </h3>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          size="lg"
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function PasswordRequirement({ met, text }) {
  return (
    <div className="flex items-center space-x-2">
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Info className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={`text-sm ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </div>
  )
}
