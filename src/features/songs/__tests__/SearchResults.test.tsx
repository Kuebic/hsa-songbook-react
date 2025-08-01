/**
 * @file SearchResults.test.tsx
 * @description Tests for SearchResults component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchResults } from '../components/search/SearchResults';
import type { SearchResult, Song } from '../types/search.types';

// Mock cn utility
vi.mock('../../../../shared/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ')
}));

// Mock data
const mockSong: Song = {
  _id: '1',
  title: 'Amazing Grace',
  artist: 'Traditional',
  slug: 'amazing-grace',
  key: 'G',
  tempo: 90,
  difficulty: 'beginner',
  themes: ['hymn', 'worship'],
  source: 'Traditional Hymnal',
  lyrics: 'Amazing grace, how sweet the sound that saved a wretch like me...',
  metadata: {
    isPublic: true,
    ratings: { average: 4.8, count: 120 },
    views: 1500
  },
  documentSize: 1024,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockSearchResult: SearchResult = {
  songs: [mockSong],
  totalCount: 1,
  currentPage: 1,
  totalPages: 1,
  availableFilters: {
    keys: [{ value: 'G', label: 'G', count: 1 }],
    difficulties: [{ value: 'beginner', label: 'Beginner', count: 1 }],
    themes: [{ value: 'hymn', label: 'Hymn', count: 1 }],
    sources: [{ value: 'Traditional Hymnal', label: 'Traditional Hymnal', count: 1 }],
    tempoRange: [90, 90]
  },
  executionTime: 150
};

describe('SearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading state when isLoading is true', () => {
      render(<SearchResults isLoading={true} />);
      
      expect(screen.getByText('Searching songs...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // spinner
    });

    it('should show custom loading component when provided', () => {
      const customLoading = <div data-testid="custom-loading">Custom Loading</div>;
      
      render(
        <SearchResults 
          isLoading={true} 
          loadingComponent={customLoading} 
        />
      );
      
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.queryByText('Searching songs...')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error state when error is present', () => {
      const error = new Error('Search failed');
      
      render(<SearchResults error={error} />);
      
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should show generic error message when error has no message', () => {
      const error = new Error();
      
      render(<SearchResults error={error} />);
      
      expect(screen.getByText('Failed to load search results. Please try again.')).toBeInTheDocument();
    });

    it('should show retry button and call onRetry when clicked', async () => {
      const onRetry = vi.fn();
      const error = new Error('Search failed');
      
      render(<SearchResults error={error} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show custom error component when provided', () => {
      const customError = <div data-testid="custom-error">Custom Error</div>;
      const error = new Error('Search failed');
      
      render(
        <SearchResults 
          error={error} 
          errorComponent={customError} 
        />
      );
      
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.queryByText('Search Error')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no results found', () => {
      const emptyResult: SearchResult = {
        ...mockSearchResult,
        songs: [],
        totalCount: 0
      };
      
      render(<SearchResults results={emptyResult} />);
      
      expect(screen.getByText('No songs found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or filters to find what you\'re looking for.')).toBeInTheDocument();
    });

    it('should show custom empty state component when provided', () => {
      const customEmpty = <div data-testid="custom-empty">No results</div>;
      const emptyResult: SearchResult = {
        ...mockSearchResult,
        songs: [],
        totalCount: 0
      };
      
      render(
        <SearchResults 
          results={emptyResult} 
          emptyStateComponent={customEmpty} 
        />
      );
      
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(screen.queryByText('No songs found')).not.toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('should display search results correctly', () => {
      render(<SearchResults results={mockSearchResult} />);
      
      // Header
      expect(screen.getByText('1 song found')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
      
      // Song information
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('by Traditional')).toBeInTheDocument();
      expect(screen.getByText('Key: G')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
      expect(screen.getByText('90 BPM')).toBeInTheDocument();
    });

    it('should display multiple songs correctly', () => {
      const multipleResults: SearchResult = {
        ...mockSearchResult,
        songs: [
          mockSong,
          {
            ...mockSong,
            _id: '2',
            title: 'How Great Thou Art',
            artist: 'Carl Boberg'
          }
        ],
        totalCount: 2
      };
      
      render(<SearchResults results={multipleResults} />);
      
      expect(screen.getByText('2 songs found')).toBeInTheDocument();
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    });

    it('should show song themes as chips', () => {
      render(<SearchResults results={mockSearchResult} />);
      
      expect(screen.getByText('hymn')).toBeInTheDocument();
      expect(screen.getByText('worship')).toBeInTheDocument();
    });

    it('should show ratings and metadata', () => {
      render(<SearchResults results={mockSearchResult} />);
      
      expect(screen.getByText('4.8 (120)')).toBeInTheDocument();
      expect(screen.getByText('1,500 views')).toBeInTheDocument();
      expect(screen.getByText('Traditional Hymnal')).toBeInTheDocument();
    });

    it('should show lyrics preview when showDetails is true', () => {
      render(<SearchResults results={mockSearchResult} showDetails={true} />);
      
      expect(screen.getByText(/Amazing grace, how sweet the sound/)).toBeInTheDocument();
    });

    it('should not show lyrics preview when showDetails is false', () => {
      render(<SearchResults results={mockSearchResult} showDetails={false} />);
      
      expect(screen.queryByText(/Amazing grace, how sweet the sound/)).not.toBeInTheDocument();
    });
  });

  describe('Song selection', () => {
    it('should call onSongSelect when song is clicked', async () => {
      const onSongSelect = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onSongSelect={onSongSelect} 
        />
      );
      
      const songElement = screen.getByRole('button', { name: /Select song Amazing Grace/ });
      fireEvent.click(songElement);
      
      expect(onSongSelect).toHaveBeenCalledWith(mockSong);
    });

    it('should call onSongSelect when Enter key is pressed on song', async () => {
      const onSongSelect = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onSongSelect={onSongSelect} 
        />
      );
      
      const songElement = screen.getByRole('button', { name: /Select song Amazing Grace/ });
      fireEvent.keyDown(songElement, { key: 'Enter' });
      
      expect(onSongSelect).toHaveBeenCalledWith(mockSong);
    });

    it('should call onSongSelect when Space key is pressed on song', async () => {
      const onSongSelect = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onSongSelect={onSongSelect} 
        />
      );
      
      const songElement = screen.getByRole('button', { name: /Select song Amazing Grace/ });
      fireEvent.keyDown(songElement, { key: ' ' });
      
      expect(onSongSelect).toHaveBeenCalledWith(mockSong);
    });

    it('should not make songs clickable when onSongSelect is not provided', () => {
      render(<SearchResults results={mockSearchResult} />);
      
      expect(screen.queryByRole('button', { name: /Select song/ })).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const multiPageResult: SearchResult = {
      ...mockSearchResult,
      currentPage: 2,
      totalPages: 5,
      totalCount: 100
    };

    it('should show pagination when onPageChange is provided', () => {
      const onPageChange = vi.fn();
      
      render(
        <SearchResults 
          results={multiPageResult} 
          onPageChange={onPageChange} 
        />
      );
      
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // current page
    });

    it('should not show pagination when onPageChange is not provided', () => {
      render(<SearchResults results={multiPageResult} />);
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should call onPageChange when pagination buttons are clicked', async () => {
      const onPageChange = vi.fn();
      
      render(
        <SearchResults 
          results={multiPageResult} 
          onPageChange={onPageChange} 
        />
      );
      
      fireEvent.click(screen.getByText('Previous'));
      expect(onPageChange).toHaveBeenCalledWith(1);
      
      fireEvent.click(screen.getByText('Next'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should disable pagination buttons when fetching', () => {
      const onPageChange = vi.fn();
      
      render(
        <SearchResults 
          results={multiPageResult} 
          onPageChange={onPageChange}
          isFetching={true}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should not show pagination for single page results', () => {
      const onPageChange = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onPageChange={onPageChange} 
        />
      );
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Fetching state', () => {
    it('should show spinner when isFetching is true', () => {
      render(<SearchResults results={mockSearchResult} isFetching={true} />);
      
      // Should show spinner in header
      const spinners = screen.getAllByRole('status', { hidden: true });
      expect(spinners.length).toBeGreaterThan(0);
    });
  });

  describe('Performance info', () => {
    const originalEnv = process.env.NODE_ENV;

    it('should show execution time in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      render(<SearchResults results={mockSearchResult} />);
      
      expect(screen.getByText('Search completed in 150.0ms')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show execution time in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      render(<SearchResults results={mockSearchResult} />);
      
      expect(screen.queryByText(/Search completed in/)).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for clickable songs', () => {
      const onSongSelect = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onSongSelect={onSongSelect} 
        />
      );
      
      expect(screen.getByRole('button', { name: 'Select song Amazing Grace' })).toBeInTheDocument();
    });

    it('should have proper button roles for pagination', () => {
      const onPageChange = vi.fn();
      const multiPageResult: SearchResult = {
        ...mockSearchResult,
        currentPage: 2,
        totalPages: 5
      };
      
      render(
        <SearchResults 
          results={multiPageResult} 
          onPageChange={onPageChange} 
        />
      );
      
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const onSongSelect = vi.fn();
      
      render(
        <SearchResults 
          results={mockSearchResult} 
          onSongSelect={onSongSelect} 
        />
      );
      
      const songElement = screen.getByRole('button', { name: /Select song Amazing Grace/ });
      expect(songElement).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('CSS classes', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SearchResults 
          results={mockSearchResult} 
          className="custom-search-results" 
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-search-results');
    });
  });
});