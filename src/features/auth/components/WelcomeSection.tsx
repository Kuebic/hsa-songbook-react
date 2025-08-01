import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Button, Card, FeatureCard } from '../../../shared/components'

export function WelcomeSection() {
  return (
    <Card>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">HSA Songbook</h1>
      
      <SignedOut>
        <div className="space-y-4">
          <p className="text-gray-600">Welcome to the HSA Songbook application.</p>
          <p className="text-gray-600">Please sign in to access your songs and setlists.</p>
          <div className="flex space-x-4">
            <SignInButton>
              <Button variant="primary" size="lg">
                Get Started - Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="success" size="lg">
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="space-y-4">
          <p className="text-gray-600">Welcome back! Manage your worship songs and setlists.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Link to="/songs">
              <FeatureCard
                title="Songs"
                description="Browse and manage your song collection"
                color="blue"
              >
                <div />
              </FeatureCard>
            </Link>
            <Link to="/setlists">
              <FeatureCard
                title="Setlists"
                description="Create and organize worship setlists"
                color="green"
              >
                <div />
              </FeatureCard>
            </Link>
          </div>
        </div>
      </SignedIn>
    </Card>
  )
}