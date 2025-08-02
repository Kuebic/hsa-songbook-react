import { Link } from 'react-router-dom'
import {
  SignedIn,  
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react'
import { Button } from '../UI/Button'
import { ThemeToggle } from '../UI/ThemeToggle'
import { useUser } from '../../../hooks/useUser'
import { ModeratorGuard, AdminGuard } from '../Auth/RoleGuard'

export function Navigation() {
  const { user } = useUser();

  return (
    <nav className="bg-blue-600 dark:bg-gray-800 text-white p-4 transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center w-full max-w-none">
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-blue-200 dark:hover:text-blue-300">
            Home
          </Link>
          <SignedIn>
            <Link to="/songs" className="hover:text-blue-200 dark:hover:text-blue-300">
              Songs
            </Link>
            <Link to="/setlists" className="hover:text-blue-200 dark:hover:text-blue-300">
              Setlists
            </Link>
            <ModeratorGuard>
              <Link to="/admin/moderate" className="hover:text-blue-200 dark:hover:text-blue-300">
                Moderate
              </Link>
            </ModeratorGuard>
            <AdminGuard>
              <Link to="/admin" className="hover:text-blue-200 dark:hover:text-blue-300">
                Admin
              </Link>
            </AdminGuard>
          </SignedIn>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle className="text-white" />
          {user && (
            <div className="text-sm">
              <span className="opacity-75">Welcome, </span>
              <span className="font-medium">{user.name}</span>
              {user.role !== 'user' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-500/30 rounded-full capitalize">
                  {user.role}
                </span>
              )}
            </div>
          )}
          <SignedOut>
            <SignInButton>
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="success" size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}