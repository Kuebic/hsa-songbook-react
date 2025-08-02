import React, { Suspense, useState } from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Card } from '../../../shared/components'
import { ChordDisplay } from './ChordDisplay'
import { useChordTransposition } from '../hooks/useChordTransposition'
import { useTheme } from '../../../shared/contexts/ThemeContext'
import { LoadingSpinner, LazyLoadErrorBoundary } from '../../../shared/components/UI'

// Lazy load ChordEditor (heaviest component with ace-builds dependency)
const ChordEditor = React.lazy(() => import('./ChordEditor'))

const sampleSong = `{title: Amazing Grace}
{subtitle: Traditional}
{key: G}
{tempo: 90}

{verse}
[G]Amazing [C]grace, how [G]sweet the sound
That [D]saved a [G]wretch like me
[G]I once was [C]lost, but [G]now I'm found
Was [D]blind, but [G]now I see

{chorus}
'Twas [G]grace that [C]taught my [G]heart to fear
And [D]grace my [G]fears relieved
How [G]precious [C]did that [G]grace appear
The [D]hour I [G]first believed`;

export function SongsPage() {
  const { transposeLevel, transposeUp, transposeDown, reset } = useChordTransposition();
  const { resolvedTheme } = useTheme();
  const [editorContent, setEditorContent] = useState(sampleSong);
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Songs</h1>
        <SignedIn>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage your songs here.</p>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-300 font-medium">🎵 ChordDisplay Component Demo</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
              Below is a working demonstration of the ChordDisplay component with transposition controls.
            </p>
          </div>
        </SignedIn>
        <SignedOut>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access your songs.</p>
        </SignedOut>
      </Card>

      <SignedIn>
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ChordEditor Demo</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1 rounded text-sm ${
                  showPreview 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
            <p className="text-green-800 dark:text-green-300 font-medium">✨ ChordEditor Component Demo</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-2">
              Edit ChordPro content below with syntax highlighting, validation, and live preview.
            </p>
          </div>

          <LazyLoadErrorBoundary componentName="Chord Editor">
            <Suspense 
              fallback={
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Chord Editor...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">This may take a moment on first load</p>
                </div>
              }
            >
              <ChordEditor
                content={editorContent}
                onChange={setEditorContent}
                showPreview={showPreview}
                theme={resolvedTheme}
                height={600}
                autoComplete={true}
                showToolbar={true}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        </Card>
        
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ChordDisplay Demo</h2>
            <div className="flex gap-2">
              <button
                onClick={() => transposeDown()}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm transition-colors"
                aria-label="Transpose down"
              >
                ♭
              </button>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm min-w-[3rem] text-center">
                {transposeLevel > 0 ? `+${transposeLevel}` : transposeLevel}
              </span>
              <button
                onClick={() => transposeUp()}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm transition-colors"
                aria-label="Transpose up"
              >
                ♯
              </button>
              <button
                onClick={reset}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          
          <ChordDisplay 
            content={editorContent}
            transpose={transposeLevel}
            theme={resolvedTheme}
            fontSize={18}
            showChords={true}
          />
        </Card>
      </SignedIn>
    </div>
  )
}

export default SongsPage