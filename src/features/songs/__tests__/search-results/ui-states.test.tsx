/**
 * @file ui-states.test.tsx
 * @description Tests for SearchResults UI states - loading, error, and empty states
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchResults } from '../../components/search/SearchResults';
import { expectComponent } from '../../../../test/assertions';
import { createMockEventHandlers } from '../../../../test/mockFactory';

// Mock cn utility
vi.mock('../../../../shared/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ')
}));

describe('SearchResults - UI States', () => {
  const mockHandlers = createMockEventHandlers();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<SearchResults isLoading={true} />);
      
      expect(screen.getByText('Searching songs...')).toBeInTheDocument();
      expectComponent.toHaveLoadingState(document.body);
    });

    it('should show loading spinner', () => {
      render(<SearchResults isLoading={true} />);
      
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toBeInTheDocument();
      expect(spinner.querySelector('svg')).toHaveClass('animate-spin');
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

    it('should apply custom className to loading state', () => {
      render(
        <SearchResults 
          isLoading={true} 
          className="custom-loading-class" 
        />
      );
      
      const loadingContainer = screen.getByText('Searching songs...').closest('div');
      expect(loadingContainer).toHaveClass('custom-loading-class');
    });

    it('should not show loading state when results exist', () => {
      const mockResults = {
        songs: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        availableFilters: {
          keys: [],
          difficulties: [],
          themes: [],
          sources: [],
          tempoRange: [0, 0] as [number, number]
        }
      };

      render(
        <SearchResults 
          isLoading={true} 
          results={mockResults} 
        />
      );
      
      expect(screen.queryByText('Searching songs...')).not.toBeInTheDocument();
    });

    it('should show loading text with proper accessibility', () => {
      render(<SearchResults isLoading={true} />);
      
      const loadingText = screen.getByText('Searching songs...');
      const container = loadingText.closest('div');
      
      expect(container).toHaveClass('search-results-loading');
      expect(loadingText).toHaveClass('text-sm', 'text-gray-600', 'dark:text-gray-400');
    });
  });

  describe('Error State', () => {
    const mockError = new Error('Failed to load results');

    it('should show error state when error exists', () => {
      render(<SearchResults error={mockError} />);
      
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load results')).toBeInTheDocument();
      expectComponent.toHaveErrorState(document.body);
    });

    it('should show error icon', () => {
      render(<SearchResults error={mockError} />);
      
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon.querySelector('path')).toHaveAttribute('d', 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
    });

    it('should show retry button when onRetry is provided', () => {
      render(
        <SearchResults 
          error={mockError} 
          onRetry={mockHandlers.onRetry} 
        />
      );
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass(
        'bg-blue-600',
        'hover:bg-blue-700',
        'text-white'
      );
    });

    it('should call onRetry when retry button is clicked', () => {
      render(
        <SearchResults 
          error={mockError} 
          onRetry={mockHandlers.onRetry} 
        />
      );
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      retryButton.click();
      
      expect(mockHandlers.onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<SearchResults error={mockError} />);
      
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    });

    it('should show custom error component when provided', () => {
      const customError = <div data-testid="custom-error">Custom Error</div>;
      
      render(
        <SearchResults 
          error={mockError} 
          errorComponent={customError} 
        />
      );
      
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.queryByText('Search Error')).not.toBeInTheDocument();
    });

    it('should show default error message when error message is empty', () => {
      const errorWithoutMessage = new Error('');
      
      render(<SearchResults error={errorWithoutMessage} />);
      
      expect(screen.getByText('Failed to load search results. Please try again.')).toBeInTheDocument();
    });

    it('should apply custom className to error state', () => {
      render(
        <SearchResults 
          error={mockError} 
          className="custom-error-class" 
        />
      );
      
      const errorContainer = screen.getByText('Search Error').closest('div');
      expect(errorContainer).toHaveClass('custom-error-class');
    });

    it('should show error state with proper accessibility', () => {
      render(<SearchResults error={mockError} />);
      
      const errorContainer = screen.getByText('Search Error').closest('div');
      expect(errorContainer).toHaveClass('search-results-error');
      
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toHaveClass('text-red-400');
    });

    it('should handle Error objects and string errors', () => {
      const { rerender } = render(<SearchResults error={mockError} />);
      expect(screen.getByText('Failed to load results')).toBeInTheDocument();

      rerender(<SearchResults error={'String error'} />);
      expect(screen.getByText('String error')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    const emptyResults = {
      songs: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      availableFilters: {
        keys: [],
        difficulties: [],
        themes: [],
        sources: [],
        tempoRange: [0, 0] as [number, number]
      }
    };

    it('should show empty state when no songs found', () => {
      render(<SearchResults results={emptyResults} />);
      
      expect(screen.getByText('No songs found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or filters to find what you\'re looking for.')).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      render(<SearchResults results={emptyResults} />);
      
      const emptyIcon = screen.getByRole('img', { hidden: true });
      expect(emptyIcon).toBeInTheDocument();
      expect(emptyIcon).toHaveClass('text-gray-400');
    });

    it('should show custom empty state component when provided', () => {
      const customEmpty = <div data-testid="custom-empty">No Results</div>;
      
      render(
        <SearchResults 
          results={emptyResults} 
          emptyStateComponent={customEmpty} 
        />
      );
      
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(screen.queryByText('No songs found')).not.toBeInTheDocument();
    });

    it('should apply custom className to empty state', () => {
      render(
        <SearchResults 
          results={emptyResults} 
          className="custom-empty-class" 
        />
      );
      
      const emptyContainer = screen.getByText('No songs found').closest('div');
      expect(emptyContainer).toHaveClass('custom-empty-class');
    });

    it('should show empty state with proper accessibility', () => {
      render(<SearchResults results={emptyResults} />);
      
      const emptyContainer = screen.getByText('No songs found').closest('div');
      expect(emptyContainer).toHaveClass('search-results-empty');
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No songs found');
      expect(heading).toHaveClass('text-lg', 'font-medium');
    });

    it('should not show empty state when songs exist', () => {
      const resultsWithSongs = {
        ...emptyResults,
        songs: [{ 
          id: '1', 
          title: 'Test Song', 
          slug: 'test-song',
          createdAt: new Date(),
          updatedAt: new Date(),
          documentSize: 1024
        }],
        totalCount: 1
      };

      render(<SearchResults results={resultsWithSongs} />);
      
      expect(screen.queryByText('No songs found')).not.toBeInTheDocument();
    });

    it('should return null when no results and no error', () => {
      const { container } = render(<SearchResults />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should show empty state centered layout', () => {
      render(<SearchResults results={emptyResults} />);
      
      const emptyContainer = screen.getByText('No songs found').closest('div');
      expect(emptyContainer).toHaveClass('py-8', 'text-center');
      
      const contentContainer = emptyContainer?.querySelector('.max-w-md');
      expect(contentContainer).toHaveClass('mx-auto');
    });

    it('should show appropriate empty state messaging', () => {
      render(<SearchResults results={emptyResults} />);
      
      const heading = screen.getByText('No songs found');
      const description = screen.getByText('Try adjusting your search terms or filters to find what you\'re looking for.');
      
      expect(heading).toHaveClass('text-gray-900', 'dark:text-gray-100');
      expect(description).toHaveClass('text-gray-600', 'dark:text-gray-400');
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to results', () => {
      const resultsWithSongs = {
        songs: [{ 
          id: '1', 
          title: 'Test Song', 
          slug: 'test-song',
          createdAt: new Date(),
          updatedAt: new Date(),
          documentSize: 1024
        }],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        availableFilters: {
          keys: [],
          difficulties: [],
          themes: [],
          sources: [],
          tempoRange: [0, 0] as [number, number]
        }
      };

      const { rerender } = render(<SearchResults isLoading={true} />);
      expect(screen.getByText('Searching songs...')).toBeInTheDocument();

      rerender(<SearchResults results={resultsWithSongs} />);
      expect(screen.queryByText('Searching songs...')).not.toBeInTheDocument();
      expect(screen.getByText('1 song found')).toBeInTheDocument();
    });

    it('should transition from loading to empty state', () => {
      const emptyResults = {
        songs: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        availableFilters: {
          keys: [],
          difficulties: [],
          themes: [],
          sources: [],
          tempoRange: [0, 0] as [number, number]
        }
      };

      const { rerender } = render(<SearchResults isLoading={true} />);
      expect(screen.getByText('Searching songs...')).toBeInTheDocument();

      rerender(<SearchResults results={emptyResults} />);
      expect(screen.queryByText('Searching songs...')).not.toBeInTheDocument();
      expect(screen.getByText('No songs found')).toBeInTheDocument();
    });

    it('should transition from loading to error state', () => {
      const error = new Error('Network error');

      const { rerender } = render(<SearchResults isLoading={true} />);
      expect(screen.getByText('Searching songs...')).toBeInTheDocument();

      rerender(<SearchResults error={error} />);
      expect(screen.queryByText('Searching songs...')).not.toBeInTheDocument();
      expect(screen.getByText('Search Error')).toBeInTheDocument();
    });
  });
});