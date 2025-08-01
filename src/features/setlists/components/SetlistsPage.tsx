import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Card } from '../../../shared/components'

export function SetlistsPage() {
  return (
    <Card>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Setlists</h1>
      <SignedIn>
        <p className="text-gray-600 mb-4">Manage your setlists here.</p>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">📋 Setlist management features coming soon!</p>
          <p className="text-green-600 text-sm mt-2">
            You'll be able to create, organize, and share worship setlists.
          </p>
        </div>
      </SignedIn>
      <SignedOut>
        <p className="text-gray-600">Please sign in to access your setlists.</p>
      </SignedOut>
    </Card>
  )
}