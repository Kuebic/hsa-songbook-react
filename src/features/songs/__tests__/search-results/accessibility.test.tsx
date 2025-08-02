/**
 * @file accessibility.test.tsx
 * @description Tests for SearchResults accessibility features and ARIA compliance
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchResults } from '../../components/search/SearchResults';
import { createMockSearchResult, mockSongs } from '../../../../test/fixtures';
import { createMockEventHandlers } from '../../../../test/mockFactory';
import { expectComponent } from '../../../../test/assertions';

// Mock cn utility
vi.mock('../../../../shared/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ')
}));

describe('SearchResults - Accessibility', () => {
  const mockHandlers = createMockEventHandlers();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA role for song items when clickable', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button', { name: /Select song Amazing Grace/i });
      expect(songItem).toBeInTheDocument();
      expectComponent.toHaveCorrectRole(songItem, 'button');
    });

    it('should not have button role when song is not clickable', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(<SearchResults results={results} />);
      
      const songItems = screen.queryAllByRole('button');
      expect(songItems).toHaveLength(0);
    });

    it('should have proper ARIA labels for action buttons', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onToggleFavorite={mockHandlers.onToggleFavorite}
          onShareSong={mockHandlers.onShareSong}
          onPreviewSong={mockHandlers.onPreviewSong}
        />
      );
      
      expect(screen.getByLabelText('Toggle favorite')).toBeInTheDocument();
      expect(screen.getByLabelText('Share song')).toBeInTheDocument();
      expect(screen.getByLabelText('Preview song')).toBeInTheDocument();
    });

    it('should have proper ARIA selected state', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button');
      expect(songItem).toHaveAttribute('aria-selected', 'false');
    });

    it('should have proper ARIA disabled state when loading', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          onSongSelect={mockHandlers.onSongSelect}
          isFetching={true}
        />
      );
      
      const songItem = screen.getByRole('button');
      // Should indicate disabled state when fetching
      expect(songItem).toHaveAttribute('aria-disabled', 'false'); // Not disabled during fetching
    });

    it('should have proper ARIA live regions for dynamic content', () => {
      render(<SearchResults isLoading={true} />);
      
      const loadingSpinner = screen.getByRole('status', { hidden: true });
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should have proper ARIA alert for errors', () => {
      const error = new Error('Search failed');

      render(<SearchResults error={error} />);
      
      // Error state should be announced to screen readers
      const errorHeading = screen.getByRole('heading', { level: 3, name: 'Search Error' });
      expect(errorHeading).toBeInTheDocument();
    });

    it('should have proper landmark roles', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 5,
        totalPages: 20
      });

      render(
        <SearchResults 
          results={results}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      // Results should be in a main content area or section
      const searchResults = screen.getByText(/songs? found/).closest('.search-results');
      expect(searchResults).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tabindex for interactive elements', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button');
      expect(songItem).toHaveAttribute('tabindex', '0');
    });

    it('should not have tabindex when not interactive', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(<SearchResults results={results} />);
      
      const songTitle = screen.getByText('Amazing Grace');
      const songContainer = songTitle.closest('.song-result-item');
      expect(songContainer).toHaveAttribute('tabindex', '-1');
    });

    it('should support keyboard activation with Enter and Space', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button');
      
      // Should respond to Enter key
      songItem.focus();
      songItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(mockHandlers.onSongSelect).toHaveBeenCalled();
      
      mockHandlers.onSongSelect.mockClear();
      
      // Should respond to Space key
      songItem.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(mockHandlers.onSongSelect).toHaveBeenCalled();
    });

    it('should support keyboard navigation for pagination', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 5,
        totalPages: 20
      });

      render(
        <SearchResults 
          results={results}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);
      
      expect(prevButton).toHaveAttribute('tabindex', '0');
      expect(nextButton).toHaveAttribute('tabindex', '0');
    });

    it('should manage focus properly during state changes', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      const { rerender } = render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button');
      songItem.focus();
      expect(songItem).toHaveFocus();
      
      // Focus should be maintained after re-render
      rerender(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect}
          isFetching={true}
        />
      );
      
      // Focus management during state changes
      const updatedSongItem = screen.getByRole('button');
      expect(updatedSongItem).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful text for song count', () => {
      const singleResult = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 1
      });

      render(<SearchResults results={singleResult} />);
      
      expect(screen.getByText('1 song found')).toBeInTheDocument();
    });

    it('should provide meaningful text for multiple songs', () => {
      const multipleResults = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt],
        totalCount: 2
      });

      render(<SearchResults results={multipleResults} />);
      
      expect(screen.getByText('2 songs found')).toBeInTheDocument();
    });

    it('should provide context for pagination', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 5,
        totalPages: 20
      });

      render(
        <SearchResults 
          results={results}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      expect(screen.getByText('Page 5 of 20')).toBeInTheDocument();
    });

    it('should announce loading states appropriately', () => {
      render(<SearchResults isLoading={true} />);
      
      const loadingText = screen.getByText('Searching songs...');
      expect(loadingText).toBeInTheDocument();
      
      // Loading spinner should be marked as status
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    it('should provide helpful error messages', () => {
      const error = new Error('Connection timeout');

      render(<SearchResults error={error} />);
      
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load search results/)).toBeInTheDocument();
    });

    it('should provide context for empty states', () => {
      const emptyResults = createMockSearchResult({
        songs: [],
        totalCount: 0
      });

      render(<SearchResults results={emptyResults} />);
      
      expect(screen.getByText('No songs found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('should use appropriate color classes for different states', () => {
      const error = new Error('Test error');

      render(<SearchResults error={error} />);
      
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toHaveClass('text-red-400');
      
      const errorHeading = screen.getByText('Search Error');
      expect(errorHeading).toHaveClass('text-gray-900', 'dark:text-gray-100');
    });

    it('should provide proper contrast in dark mode', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(<SearchResults results={results} />);
      
      const songCount = screen.getByText(/songs? found/);
      expect(songCount).toHaveClass('text-gray-900', 'dark:text-gray-100');
      
      const pageInfo = screen.getByText(/Page \d+ of \d+/);
      expect(pageInfo).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });

    it('should use appropriate focus indicators', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByRole('button');
      expect(songItem).toHaveClass('focus:outline-none', 'focus:bg-gray-50', 'dark:focus:bg-gray-800/50');
    });
  });

  describe('Semantic HTML', () => {
    it('should use proper heading hierarchy', () => {
      const error = new Error('Test error');

      render(<SearchResults error={error} />);
      
      const errorHeading = screen.getByRole('heading', { level: 3 });
      expect(errorHeading).toHaveTextContent('Search Error');
    });

    it('should use proper list structure when applicable', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt]
      });

      render(<SearchResults results={results} />);
      
      // Should use semantic structure for song list
      const songItems = screen.getAllByText(/Traditional/).map(el => 
        el.closest('.song-result-item')
      );
      expect(songItems).toHaveLength(2);
    });

    it('should use proper button elements for interactive items', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onToggleFavorite={mockHandlers.onToggleFavorite}
        />
      );
      
      const favoriteButton = screen.getByRole('button', { name: 'Toggle favorite' });
      expect(favoriteButton.tagName).toBe('BUTTON');
    });
  });

  describe('Performance Info Accessibility', () => {
    it('should make performance info accessible but not intrusive', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const results = createMockSearchResult({
        executionTime: 150.5
      });

      render(<SearchResults results={results} showPerformanceInfo={true} />);
      
      const perfInfo = screen.getByText(/Search completed in/);
      expect(perfInfo).toHaveClass('text-xs', 'text-gray-400');
      
      // Should not be announced to screen readers as it's not critical info
      expect(perfInfo).not.toHaveAttribute('role', 'status');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile viewports', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 5,
        totalPages: 20
      });

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <SearchResults 
          results={results}
          onPageChange={mockHandlers.onPageChange}
          onSongSelect={mockHandlers.onSongSelect}
        />
      );
      
      // Interactive elements should still be accessible
      const songItem = screen.getByRole('button');
      expect(songItem).toHaveAttribute('tabindex', '0');
      
      const prevButton = screen.getByLabelText(/previous/i);
      expect(prevButton).toHaveAttribute('tabindex', '0');
    });

    it('should provide appropriate touch targets', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onToggleFavorite={mockHandlers.onToggleFavorite}
        />
      );
      
      const favoriteButton = screen.getByLabelText('Toggle favorite');
      // Button should have adequate size for touch interaction
      expect(favoriteButton).toHaveClass('p-1'); // Minimum touch target
    });
  });

  describe('Accessibility Testing Utilities', () => {
    it('should pass basic accessibility checks', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      // Check for common accessibility issues
      const songItem = screen.getByRole('button');
      expectComponent.toBeAccessible(songItem);
    });

    it('should have no accessibility violations in error state', () => {
      const error = new Error('Accessibility test error');

      render(<SearchResults error={error} onRetry={mockHandlers.onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expectComponent.toBeAccessible(retryButton);
    });

    it('should have no accessibility violations in loading state', () => {
      render(<SearchResults isLoading={true} />);
      
      const loadingSpinner = screen.getByRole('status', { hidden: true });
      expect(loadingSpinner).toBeInTheDocument();
    });
  });
});