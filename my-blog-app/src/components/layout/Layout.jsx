import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  const location = useLocation()
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname)

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <div className="animate-in">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}