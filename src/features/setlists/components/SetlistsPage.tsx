import { useState } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Card, Button } from '../../../shared/components';
import { SetlistBuilder } from './SetlistBuilder';
import { useSetlistStore } from '../stores';
import type { Setlist } from '../types';

export function SetlistsPage() {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [currentSetlistId, setCurrentSetlistId] = useState<string | null>(null);
  const { user } = useUser();
  const { createSetlist, loadSetlist, clearSetlist } = useSetlistStore();

  // Mock setlists data (in real implementation, this would come from API)
  const [setlists, setSetlists] = useState<Setlist[]>([
    {
      id: '1',
      name: 'Sunday Morning Service',
      description: 'Regular Sunday worship setlist',
      songs: [
        {
          id: 'item1',
          songId: 'song1',
          songTitle: 'Amazing Grace',
          songArtist: 'Traditional',
          originalKey: 'G',
          transpose: 0,
          order: 0,
          notes: 'Start slow, build up on verse 3'
        },
        {
          id: 'item2',
          songId: 'song2',
          songTitle: 'How Great Thou Art',
          songArtist: 'Traditional',
          originalKey: 'A',
          transpose: -2,
          order: 1,
          notes: 'Acoustic guitar only for verses'
        }
      ],
      tags: ['sunday', 'morning'],
      isPublic: false,
      estimatedDuration: 25,
      usageCount: 5,
      createdBy: user?.id || '',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      syncStatus: 'synced',
      hasUnsavedChanges: false
    },
    {
      id: '2',
      name: 'Evening Prayer',
      description: 'Contemplative evening service',
      songs: [
        {
          id: 'item3',
          songId: 'song3',
          songTitle: 'In Christ Alone',
          songArtist: 'Keith Getty',
          originalKey: 'C',
          transpose: 0,
          order: 0
        }
      ],
      tags: ['evening', 'contemplative'],
      isPublic: true,
      estimatedDuration: 15,
      usageCount: 2,
      createdBy: user?.id || '',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12'),
      syncStatus: 'synced',
      hasUnsavedChanges: false
    }
  ]);

  // Handle creating new setlist
  const handleCreateNew = () => {
    if (user) {
      createSetlist('New Setlist', user.id);
      setCurrentSetlistId(null);
      setView('builder');
    }
  };

  // Handle editing existing setlist
  const handleEdit = (setlist: Setlist) => {
    loadSetlist(setlist);
    setCurrentSetlistId(setlist.id);
    setView('builder');
  };

  // Handle saving setlist
  const handleSave = (setlist: Setlist) => {
    // In real implementation, this would save to API
    console.log('Saving setlist:', setlist);
    
    // Update local state
    setSetlists(prev => {
      const index = prev.findIndex(s => s.id === setlist.id);
      if (index >= 0) {
        // Update existing
        const updated = [...prev];
        updated[index] = { ...setlist, hasUnsavedChanges: false };
        return updated;
      } else {
        // Add new
        return [...prev, { ...setlist, id: Date.now().toString(), hasUnsavedChanges: false }];
      }
    });
    
    setView('list');
    clearSetlist();
  };

  // Handle cancel
  const handleCancel = () => {
    setView('list');
    clearSetlist();
    setCurrentSetlistId(null);
  };

  // Handle delete
  const handleDelete = (setlistId: string) => {
    if (window.confirm('Are you sure you want to delete this setlist?')) {
      setSetlists(prev => prev.filter(s => s.id !== setlistId));
    }
  };

  return (
    <div className="setlists-page">
      {view === 'list' ? (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Setlists</h1>
            <SignedIn>
              <Button
                onClick={handleCreateNew}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Setlist
              </Button>
            </SignedIn>
          </div>

          <SignedIn>
            {setlists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No setlists yet</h3>
                <p className="text-gray-500 mb-6">Create your first setlist to get started.</p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create First Setlist
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {setlists.map((setlist) => (
                  <div
                    key={setlist.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {setlist.name}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(setlist)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit setlist"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(setlist.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete setlist"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {setlist.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {setlist.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{setlist.songs.length} songs</span>
                      {setlist.estimatedDuration && (
                        <span>≈ {setlist.estimatedDuration}m</span>
                      )}
                      {setlist.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Public
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {setlist.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      Last updated: {setlist.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SignedIn>

          <SignedOut>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Setlists</h3>
              <p className="text-gray-600">Please sign in to create and manage your worship setlists.</p>
            </div>
          </SignedOut>
        </Card>
      ) : (
        <SetlistBuilder
          setlistId={currentSetlistId || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          className="max-w-4xl mx-auto"
        />
      )}
    </div>
  );
}