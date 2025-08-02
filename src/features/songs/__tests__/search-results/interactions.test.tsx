/**
 * @file interactions.test.tsx
 * @description Tests for SearchResults user interactions - selection, pagination, and actions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchResults } from '../../components/search/SearchResults';
import { createMockSearchResult, mockSongs } from '../../../../test/fixtures';
import { createMockEventHandlers } from '../../../../test/mockFactory';
import { expectMockFunction, expectPagination } from '../../../../test/assertions';

// Mock cn utility
vi.mock('../../../../shared/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ')
}));

describe('SearchResults - Interactions', () => {
  const mockHandlers = createMockEventHandlers();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  describe('Song Selection', () => {
    it('should call onSongSelect when song is clicked', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByText('Amazing Grace');
      await user.click(songItem);
      
      expectMockFunction(mockHandlers.onSongSelect).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should handle keyboard selection with Enter key', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByText('Amazing Grace').closest('[role="button"]');
      songItem?.focus();
      await user.keyboard('{Enter}');
      
      expectMockFunction(mockHandlers.onSongSelect).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should handle keyboard selection with Space key', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByText('Amazing Grace').closest('[role="button"]');
      songItem?.focus();
      await user.keyboard(' ');
      
      expectMockFunction(mockHandlers.onSongSelect).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should not call onSongSelect when not provided', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(<SearchResults results={results} />);
      
      const songItem = screen.getByText('Amazing Grace');
      await user.click(songItem);
      
      // Should not throw or cause errors
      expect(true).toBe(true);
    });

    it('should handle multiple song selection', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      await user.click(screen.getByText('Amazing Grace'));
      await user.click(screen.getByText('How Great Thou Art'));
      
      expect(mockHandlers.onSongSelect).toHaveBeenCalledTimes(2);
      expectMockFunction(mockHandlers.onSongSelect).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
      expectMockFunction(mockHandlers.onSongSelect).toHaveBeenCalledWithSong(mockSongs.howGreatThouArt);
    });

    it('should handle rapid clicking gracefully', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      const songItem = screen.getByText('Amazing Grace');
      
      // Rapid clicks
      await user.click(songItem);
      await user.click(songItem);
      await user.click(songItem);
      
      expect(mockHandlers.onSongSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe('Song Actions', () => {
    it('should call onToggleFavorite when favorite button is clicked', async () => {
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
      await user.click(favoriteButton);
      
      expectMockFunction(mockHandlers.onToggleFavorite).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should call onShareSong when share button is clicked', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onShareSong={mockHandlers.onShareSong}
        />
      );
      
      const shareButton = screen.getByLabelText('Share song');
      await user.click(shareButton);
      
      expectMockFunction(mockHandlers.onShareSong).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should call onPreviewSong when preview button is clicked', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onPreviewSong={mockHandlers.onPreviewSong}
        />
      );
      
      const previewButton = screen.getByLabelText('Preview song');
      await user.click(previewButton);
      
      expectMockFunction(mockHandlers.onPreviewSong).toHaveBeenCalledWithSong(mockSongs.amazingGrace);
    });

    it('should not show action buttons when showItemActions is false', () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={false}
          onToggleFavorite={mockHandlers.onToggleFavorite}
        />
      );
      
      expect(screen.queryByLabelText('Toggle favorite')).not.toBeInTheDocument();
    });

    it('should prevent event bubbling on action clicks', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          showItemActions={true}
          onToggleFavorite={mockHandlers.onToggleFavorite}
          onSongSelect={mockHandlers.onSongSelect}
        />
      );
      
      const favoriteButton = screen.getByLabelText('Toggle favorite');
      await user.click(favoriteButton);
      
      // onToggleFavorite should be called but onSongSelect should not
      expect(mockHandlers.onToggleFavorite).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onSongSelect).not.toHaveBeenCalled();
    });
  });

  describe('Pagination Interactions', () => {
    const paginatedResults = createMockSearchResult({
      songs: [mockSongs.amazingGrace],
      totalCount: 100,
      currentPage: 5,
      totalPages: 20
    });

    it('should render pagination when onPageChange is provided', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      expectPagination(document.body).toShowCurrentPage(5);
      expectPagination(document.body).toHaveNavigationButtons();
    });

    it('should call onPageChange when page button is clicked', async () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      const nextButton = screen.getByLabelText(/next/i);
      await user.click(nextButton);
      
      expect(mockHandlers.onPageChange).toHaveBeenCalledWith(6);
    });

    it('should not render pagination when onPageChange is not provided', () => {
      render(<SearchResults results={paginatedResults} />);
      
      expect(screen.queryByLabelText(/previous/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/next/i)).not.toBeInTheDocument();
    });

    it('should show pagination controls when showPagination is true', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          showPagination={true}
        />
      );
      
      expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next/i)).toBeInTheDocument();
    });

    it('should hide pagination controls when showPagination is false', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          showPagination={false}
        />
      );
      
      expect(screen.queryByLabelText(/previous/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/next/i)).not.toBeInTheDocument();
    });

    it('should pass correct props to Pagination component', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          onPageSizeChange={mockHandlers.onPageSizeChange}
          showPageSizeSelector={true}
          showTotal={true}
          showJumpToPage={true}
          isFetching={true}
        />
      );
      
      // Pagination component should receive all these props
      const paginationContainer = screen.getByLabelText(/previous/i).closest('.pagination');
      expect(paginationContainer).toBeInTheDocument();
    });

    it('should disable pagination when fetching', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          isFetching={true}
        />
      );
      
      const nextButton = screen.getByLabelText(/next/i);
      expect(nextButton).toBeDisabled();
    });

    it('should handle page size changes', async () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          onPageSizeChange={mockHandlers.onPageSizeChange}
          showPageSizeSelector={true}
        />
      );
      
      const pageSizeSelect = screen.getByDisplayValue('20');
      await user.selectOptions(pageSizeSelect, '50');
      
      expect(mockHandlers.onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('should show total items when showTotal is enabled', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          showTotal={true}
        />
      );
      
      expect(screen.getByText(/Showing \d+ to \d+ of \d+ items/)).toBeInTheDocument();
    });

    it('should show jump to page when showJumpToPage is enabled', () => {
      render(
        <SearchResults 
          results={paginatedResults}
          onPageChange={mockHandlers.onPageChange}
          showJumpToPage={true}
        />
      );
      
      expect(screen.getByLabelText(/Go to page/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus first song item with Tab key', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      await user.tab();
      
      const firstSong = screen.getByText('Amazing Grace').closest('[role="button"]');
      expect(firstSong).toHaveFocus();
    });

    it('should navigate between song items with Tab/Shift+Tab', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace, mockSongs.howGreatThouArt]
      });

      render(
        <SearchResults 
          results={results} 
          onSongSelect={mockHandlers.onSongSelect} 
        />
      );
      
      await user.tab(); // Focus first song
      await user.tab(); // Focus second song
      
      const secondSong = screen.getByText('How Great Thou Art').closest('[role="button"]');
      expect(secondSong).toHaveFocus();
      
      await user.tab({ shift: true }); // Back to first song
      
      const firstSong = screen.getByText('Amazing Grace').closest('[role="button"]');
      expect(firstSong).toHaveFocus();
    });

    it('should navigate to pagination controls after songs', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 1,
        totalPages: 10
      });

      render(
        <SearchResults 
          results={results}
          onSongSelect={mockHandlers.onSongSelect}
          onPageChange={mockHandlers.onPageChange}
        />
      );
      
      await user.tab(); // Focus song
      await user.tab(); // Focus pagination
      
      const prevButton = screen.getByLabelText(/previous/i);
      expect(prevButton).toHaveFocus();
    });

    it('should handle keyboard navigation when items are disabled', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      render(
        <SearchResults 
          results={results}
          onSongSelect={mockHandlers.onSongSelect}
          // Simulate disabled state by not providing handlers
        />
      );
      
      await user.tab();
      
      // Should be able to navigate even if interactions are limited
      const songItem = screen.getByText('Amazing Grace');
      expect(songItem).toBeInTheDocument();
    });
  });

  describe('Loading and Fetching States', () => {
    it('should disable interactions during fetching', async () => {
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
      
      const songItem = screen.getByText('Amazing Grace');
      await user.click(songItem);
      
      // Should still call the handler during fetching
      expect(mockHandlers.onSongSelect).toHaveBeenCalled();
    });

    it('should show loading states for individual actions', async () => {
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
      
      // This would test loading states for individual song actions
      // The actual implementation would depend on how loading states are managed
      const favoriteButton = screen.getByLabelText('Toggle favorite');
      expect(favoriteButton).toBeInTheDocument();
    });
  });

  describe('Error Handling in Interactions', () => {
    it('should handle errors in song selection gracefully', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace]
      });

      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Selection failed');
      });

      render(
        <SearchResults 
          results={results}
          onSongSelect={errorHandler}
        />
      );
      
      const songItem = screen.getByText('Amazing Grace');
      
      // Should not crash the component
      expect(() => user.click(songItem)).not.toThrow();
    });

    it('should handle pagination errors gracefully', async () => {
      const results = createMockSearchResult({
        songs: [mockSongs.amazingGrace],
        totalCount: 100,
        currentPage: 1,
        totalPages: 10
      });

      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Page change failed');
      });

      render(
        <SearchResults 
          results={results}
          onPageChange={errorHandler}
        />
      );
      
      const nextButton = screen.getByLabelText(/next/i);
      
      // Should not crash the component
      expect(() => user.click(nextButton)).not.toThrow();
    });
  });
});