import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loading } from '../common/Loading'

export function AuthGuard({ children, requireAuth = true }) {
  const { user, isLoading, checkAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsChecking(false)
      }
    }

    verifyAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isChecking && !isLoading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        navigate('/login', {
          state: { from: location.pathname },
          replace: true
        })
      } else if (!requireAuth && user) {
        // Redirect to home if user is already logged in and tries to access auth pages
        navigate('/', { replace: true })
      }
    }
  }, [user, isLoading, isChecking, requireAuth, navigate, location])

  // Show loading state while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  // Show error state if authentication is required but user is not logged in
  if (requireAuth && !user) {
    return null // The useEffect will handle the redirect
  }

  // Show error state if user is logged in but tries to access auth pages
  if (!requireAuth && user) {
    return null // The useEffect will handle the redirect
  }

  // Render children if authentication requirements are met
  return (
    <>
      {children}
      {/* Session timeout warning */}
      <SessionTimeoutWarning />
    </>
  )
}

// Component to show warning when session is about to expire
function SessionTimeoutWarning() {
  const { user, refreshToken } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const WARNING_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

  useEffect(() => {
    if (!user?.exp) return

    const expiryTime = user.exp * 1000 // Convert to milliseconds
    const warningTime = expiryTime - WARNING_THRESHOLD
    const now = Date.now()

    if (now < warningTime) {
      // Set timeout to show warning
      const warningTimeout = setTimeout(() => {
        setShowWarning(true)
      }, warningTime - now)

      return () => clearTimeout(warningTimeout)
    }
  }, [user])

  if (!showWarning) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-yellow-50 p-4 shadow-lg dark:bg-yellow-900/50">
      <div className="flex items-center space-x-3">
        <svg
          className="h-6 w-6 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h3 className="font-medium text-yellow-800 dark:text-yellow-100">
            Session Expiring Soon
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">
            Your session will expire soon. Would you like to stay logged in?
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={refreshToken}
              className="rounded-md bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2"
            >
              Stay Logged In
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="rounded-md bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 dark:bg-yellow-900/30 dark:text-yellow-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// HOC to wrap protected routes
export function withAuth(Component, options = { requireAuth: true }) {
  return function WrappedComponent(props) {
    return (
      <AuthGuard requireAuth={options.requireAuth}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
