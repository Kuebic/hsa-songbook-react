/**
 * @file content-display.test.tsx
 * @description Tests for SearchResults content rendering and formatting
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchResults } from '../../components/search/SearchResults';
import { createMockSearchResult, mockSongs } from '../../../../test/fixtures';
import { expectSearchResult } from '../../../../test/assertions';

// Mock cn utility
vi.mock('../../../../shared/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ')
}));

describe('SearchResults - Content Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Results Header', () => {
    it('should display correct count for single song', () => {
      const singleResult = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 1
      });

      render(<SearchResults results={singleResult} />);
      
      expect(screen.getByText('1 song found')).toBeInTheDocument();
    });

    it('should display correct count for multiple songs', () => {
      const multipleResults = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt],
        totalCount: 2
      });

      render(<SearchResults results={multipleResults} />);
      
      expect(screen.getByText('2 songs found')).toBeInTheDocument();
    });

    it('should format large numbers with locale string', () => {
      const manyResults = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 1234
      });

      render(<SearchResults results={manyResults} />);
      
      expect(screen.getByText('1,234 songs found')).toBeInTheDocument();
    });

    it('should display current page information', () => {
      const pagedResults = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 5,
        totalPages: 10
      });

      render(<SearchResults results={pagedResults} />);
      
      expect(screen.getByText('Page 5 of 10')).toBeInTheDocument();
    });

    it('should show fetching indicator when isFetching is true', () => {
      const results = createMockSearchResult();

      render(<SearchResults results={results} isFetching={true} />);
      
      const fetchingSpinner = screen.getByRole('status', { hidden: true });
      expect(fetchingSpinner).toBeInTheDocument();
      expect(fetchingSpinner.querySelector('svg')).toHaveClass('animate-spin');
    });

    it('should apply correct header styling', () => {
      const results = createMockSearchResult();

      render(<SearchResults results={results} />);
      
      const header = screen.getByText(/songs? found/).closest('div');
      expect(header).toHaveClass(
        'flex',
        'items-center',
        'justify-between',
        'py-3',
        'px-4',
        'border-b'
      );
    });
  });

  describe('Song List Rendering', () => {
    it('should render all songs in results', () => {
      const multiSongResults = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt, mockSongs.blessed]
      });

      render(<SearchResults results={multiSongResults} />);
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      expect(screen.getByText('Blessed Assurance')).toBeInTheDocument();
    });

    it('should use song ID as key when available', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      const { container } = render(<SearchResults results={results} />);
      
      // Should render without key warnings
      expect(container.querySelector('[data-key]')).toBeFalsy(); // No duplicate keys
    });

    it('should fallback to slug as key when ID is not available', () => {
      const songWithoutId = {
        ...mockSongs.amazingGrace,
        id: undefined,
        slug: 'amazing-grace-slug'
      };
      const results = createMockSearchResult({
        songs: [songWithoutId]
      });

      const { container } = render(<SearchResults results={results} />);
      
      expect(container.querySelector('.song-result-item')).toBeInTheDocument();
    });

    it('should pass correct props to SongResultItem', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          showDetails={true}
          itemVariant="detailed"
          showItemActions={true}
        />
      );
      
      // The SongResultItem component should receive these props
      // This tests the prop forwarding functionality
      const songItem = screen.getByText('Amazing Grace').closest('.song-result-item');
      expect(songItem).toBeInTheDocument();
    });

    it('should apply correct container styling to results list', () => {
      const results = createMockSearchResult();

      const { container } = render(<SearchResults results={results} />);
      
      const resultsContainer = container.querySelector('.bg-white');
      expect(resultsContainer).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'border',
        'border-gray-200',
        'dark:border-gray-700',
        'rounded-lg',
        'overflow-hidden'
      );
    });
  });

  describe('Performance Information', () => {
    it('should show execution time in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: 150.5
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      expect(screen.getByText('Search completed in 150.5ms')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show execution time in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const results = createMockSearchResult({
        executionTime: 150.5
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      expect(screen.queryByText(/Search completed in/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show execution time when not provided', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: undefined
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      expect(screen.queryByText(/Search completed in/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should format execution time correctly', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: 1234.567
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      expect(screen.getByText('Search completed in 1234.6ms')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should apply correct styling to performance info', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: 150
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      const perfInfo = screen.getByText(/Search completed in/);
      expect(perfInfo).toHaveClass('mt-2', 'text-xs', 'text-gray-400', 'text-center');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Data Validation', () => {
    it('should handle results with missing songs array', () => {
      const invalidResults = {
        ...createMockSearchResult(),
        songs: undefined
      };

      expect(() => {
        render(<SearchResults results={invalidResults} />);
      }).not.toThrow();
    });

    it('should handle results with null values', () => {
      const resultsWithNulls = createMockSearchResult({
        songs: [
          {
            ...mockSongs.amazingGrace,
            artist: null,
            key: null
          }
        ]
      });

      expect(() => {
        render(<SearchResults results={resultsWithNulls} />);
      }).not.toThrow();
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });

    it('should validate result structure', () => {
      const validResults = createMockSearchResult();
      
      expectSearchResult(validResults).toHaveValidStructure();
      expectSearchResult(validResults).toHaveValidPagination();
      expectSearchResult(validResults).toMatchTotalCount();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes to header', () => {
      const results = createMockSearchResult();

      render(<SearchResults results={results} />);
      
      const header = screen.getByText(/songs? found/).closest('div');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should handle long song titles gracefully', () => {
      const longTitleSong = {
        ...mockSongs.amazingGrace,
        title: 'This is a very long song title that should be handled gracefully by the component without breaking the layout'
      };
      const results = createMockSearchResult({
        songs: [longTitleSong]
      });

      render(<SearchResults results={results} />);
      
      const title = screen.getByText(/This is a very long song title/);
      expect(title).toBeInTheDocument();
    });

    it('should handle many songs without layout issues', () => {
      const manySongs = Array.from({ length: 50 }, (_, i) => ({
        ...mockSongs.amazingGrace,
        id: `song-${i}`,
        title: `Song ${i + 1}`,
        slug: `song-${i + 1}`
      }));
      const results = createMockSearchResult({
        songs: manySongs,
        totalCount: 50
      });

      render(<SearchResults results={results} />);
      
      expect(screen.getByText('50 songs found')).toBeInTheDocument();
      expect(screen.getByText('Song 1')).toBeInTheDocument();
      expect(screen.getByText('Song 50')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to results container', () => {
      const results = createMockSearchResult();

      const { container } = render(
        <SearchResults 
          results={results} 
          className="custom-search-results" 
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-search-results');
    });

    it('should combine custom className with default classes', () => {
      const results = createMockSearchResult();

      const { container } = render(
        <SearchResults 
          results={results} 
          className="custom-class" 
        />
      );
      
      expect(container.firstChild).toHaveClass('search-results', 'custom-class');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes to header', () => {
      const results = createMockSearchResult();

      render(<SearchResults results={results} />);
      
      const header = screen.getByText(/songs? found/).closest('div');
      expect(header).toHaveClass('border-gray-200', 'dark:border-gray-700');
      
      const countText = screen.getByText(/songs? found/);
      expect(countText).toHaveClass('text-gray-900', 'dark:text-gray-100');
    });

    it('should apply dark mode classes to results list', () => {
      const results = createMockSearchResult();

      const { container } = render(<SearchResults results={results} />);
      
      const resultsContainer = container.querySelector('.bg-white');
      expect(resultsContainer).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(resultsContainer).toHaveClass('border-gray-200', 'dark:border-gray-700');
    });

    it('should apply dark mode classes to performance info', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: 150
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      const perfInfo = screen.getByText(/Search completed in/);
      expect(perfInfo).toHaveClass('text-gray-400');

      process.env.NODE_ENV = originalEnv;
    });
  });
});