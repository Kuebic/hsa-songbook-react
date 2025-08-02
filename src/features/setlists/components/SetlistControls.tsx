/**
 * @file src/features/setlists/components/SetlistControls.tsx
 * @description Control panel for adding songs and managing setlist actions
 */

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { useSetlistStore } from '../stores';

interface SetlistControlsProps {
  compactMode?: boolean;
}

export const SetlistControls: React.FC<SetlistControlsProps> = ({
  compactMode = false
}) => {
  const [showAddSongPanel, setShowAddSongPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  
  const { addSong } = useSetlistStore();

  // Mock songs data (in real implementation, this would come from API/search)
  const mockSongs = [
    { id: 'song1', title: 'Amazing Grace', artist: 'Traditional', key: 'G', tempo: 80 },
    { id: 'song2', title: 'How Great Thou Art', artist: 'Traditional', key: 'A', tempo: 90 },
    { id: 'song3', title: 'In Christ Alone', artist: 'Keith Getty', key: 'C', tempo: 100 },
    { id: 'song4', title: 'What a Beautiful Name', artist: 'Hillsong Worship', key: 'D', tempo: 75 },
    { id: 'song5', title: 'Cornerstone', artist: 'Hillsong Worship', key: 'E', tempo: 85 },
  ];

  // Filter songs based on search
  const filteredSongs = mockSongs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle adding a song
  const handleAddSong = useCallback((songId: string) => {
    const song = mockSongs.find(s => s.id === songId);
    if (song) {
      addSong({
        songId: song.id,
        transpose: 0,
      });
      setShowAddSongPanel(false);
      setSearchQuery('');
      setSelectedSongId(null);
    }
  }, [addSong, mockSongs]);

  return (
    <div className={clsx(
      'setlist-controls',
      'border-t',
      'border-gray-200',
      'pt-4',
      'mt-4',
      {
        'pt-2 mt-2': compactMode,
      }
    )}>
      {!showAddSongPanel ? (
        // Add song button
        <div className="text-center">
          <button
            onClick={() => setShowAddSongPanel(true)}
            className={clsx(
              'inline-flex',
              'items-center',
              'px-4',
              'py-2',
              'bg-blue-600',
              'text-white',
              'rounded-lg',
              'hover:bg-blue-700',
              'transition-colors',
              'font-medium',
              'shadow-sm',
              {
                'px-3 py-1.5 text-sm': compactMode,
              }
            )}
          >
            <svg 
              className={clsx(
                'mr-2',
                {
                  'w-5 h-5': !compactMode,
                  'w-4 h-4': compactMode,
                }
              )}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            Add Song
          </button>
        </div>
      ) : (
        // Add song panel
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={clsx(
              'font-medium',
              'text-gray-900',
              {
                'text-lg': !compactMode,
                'text-base': compactMode,
              }
            )}>
              Add Song to Setlist
            </h3>
            <button
              onClick={() => {
                setShowAddSongPanel(false);
                setSearchQuery('');
                setSelectedSongId(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close add song panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search input */}
          <div className="mb-4">
            <label className="sr-only" htmlFor="song-search">
              Search songs
            </label>
            <div className="relative">
              <input
                id="song-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs by title or artist..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              <svg 
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>

          {/* Song list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No songs found matching your search' : 'No songs available'}
              </div>
            ) : (
              filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className={clsx(
                    'flex',
                    'items-center',
                    'justify-between',
                    'p-3',
                    'bg-white',
                    'border',
                    'border-gray-200',
                    'rounded-lg',
                    'hover:border-blue-300',
                    'hover:shadow-sm',
                    'transition-all',
                    'cursor-pointer',
                    {
                      'border-blue-500 bg-blue-50': selectedSongId === song.id,
                    }
                  )}
                  onClick={() => setSelectedSongId(song.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSongId(song.id);
                    }
                  }}
                >
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-medium text-gray-900 truncate">
                      {song.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 truncate">
                        {song.artist}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-mono">
                        {song.key}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {song.tempo} BPM
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSong(song.id);
                    }}
                    className="ml-3 flex-shrink-0 inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick add selected song */}
          {selectedSongId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Selected: <strong>{filteredSongs.find(s => s.id === selectedSongId)?.title}</strong>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSongId(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleAddSong(selectedSongId)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add to Setlist
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetlistControls;