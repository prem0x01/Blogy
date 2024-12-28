import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { Layout } from './components/layout/Layout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BlogDetails from './pages/BlogDetails'
import CreateBlog from './pages/CreateBlog'
import EditBlog from './pages/EditBlog'
import UserProfile from './pages/UserProfile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="login"
          element={
            <AuthGuard requireAuth={false}>
              <Login />
            </AuthGuard>
          }
        />
        <Route
          path="signup"
          element={
            <AuthGuard requireAuth={false}>
              <Signup />
            </AuthGuard>
          }
        />
        <Route path="blog/:id" element={<BlogDetails />} />

        {/* Protected Routes */}
        <Route
          path="new"
          element={
            <AuthGuard>
              <CreateBlog />
            </AuthGuard>
          }
        />
        <Route
          path="edit/:id"
          element={
            <AuthGuard>
              <EditBlog />
            </AuthGuard>
          }
        />
        <Route
          path="profile"
          element={
            <AuthGuard>
              <UserProfile />
            </AuthGuard>
          }
        />
        <Route
          path="settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
