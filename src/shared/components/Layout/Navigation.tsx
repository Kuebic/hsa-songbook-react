import { Link } from 'react-router-dom'
import {
  SignedIn,  
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react'
import { Button } from '../UI/Button'

export function Navigation() {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-blue-200">
            Home
          </Link>
          <SignedIn>
            <Link to="/songs" className="hover:text-blue-200">
              Songs
            </Link>
            <Link to="/setlists" className="hover:text-blue-200">
              Setlists
            </Link>
          </SignedIn>
        </div>
        
        <div className="flex items-center space-x-4">
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