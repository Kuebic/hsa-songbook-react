import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Card } from '../../../shared/components'

export function SongsPage() {
  return (
    <Card>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Songs</h1>
      <SignedIn>
        <p className="text-gray-600 mb-4">Manage your songs here.</p>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-medium">🎵 Song management features coming soon!</p>
          <p className="text-blue-600 text-sm mt-2">
            You'll be able to create, edit, and organize your worship songs.
          </p>
        </div>
      </SignedIn>
      <SignedOut>
        <p className="text-gray-600">Please sign in to access your songs.</p>
      </SignedOut>
    </Card>
  )
}