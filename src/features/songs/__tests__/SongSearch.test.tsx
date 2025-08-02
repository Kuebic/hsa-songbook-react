/**
 * @file SongSearch.test.tsx
 * @description Comprehensive tests for SongSearch component
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SongSearch } from '../components/search/SongSearch';
import type { SearchFilters } from '../types/search.types';

// Mock react-router-dom hooks
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams]
  };
});

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SongSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  /**
   * PRIMARY ACCEPTANCE CRITERIA TEST
   * Tests the required 300ms debounce functionality
   */
  it('debounces search input', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch onSearch={onSearch} />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText(/search songs/i);
    
    // Type the search query
    await user.type(input, 'Amazing');
    
    // Should not have called onSearch yet (debouncing)
    expect(onSearch).not.toHaveBeenCalled();
    
    // Fast-forward time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now it should have been called exactly once with the final value
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Amazing'
        })
      );
    }, { timeout: 400 }); // 300ms debounce + buffer
  });

  it('renders with default props', () => {
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Search songs...');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('renders with custom placeholder', () => {
    render(
      <TestWrapper>
        <SongSearch placeholder="Find your favorite songs..." />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Find your favorite songs...')).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <TestWrapper>
        <SongSearch disabled={true} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('shows filter button when enabled', () => {
    const onFilterClick = vi.fn();
    
    render(
      <TestWrapper>
        <SongSearch showFilterButton={true} onFilterClick={onFilterClick} />
      </TestWrapper>
    );

    const filterButton = screen.getByLabelText(/show filters/i);
    expect(filterButton).toBeInTheDocument();
  });

  it('hides filter button when disabled', () => {
    render(
      <TestWrapper>
        <SongSearch showFilterButton={false} />
      </TestWrapper>
    );

    expect(screen.queryByLabelText(/filters/i)).not.toBeInTheDocument();
  });

  it('calls onFilterClick when filter button is clicked', async () => {
    const onFilterClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SongSearch showFilterButton={true} onFilterClick={onFilterClick} />
      </TestWrapper>
    );

    const filterButton = screen.getByLabelText(/show filters/i);
    await user.click(filterButton);

    expect(onFilterClick).toHaveBeenCalledTimes(1);
  });

  it('shows clear button when there is text', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input.value).toBe('');
  });

  it('handles multiple rapid keystrokes with proper debouncing', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch onSearch={onSearch} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    // Type multiple characters rapidly
    await user.type(input, 'A');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'm');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'a');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'z');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'i');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'n');
    act(() => vi.advanceTimersByTime(100));
    
    await user.type(input, 'g');
    
    // Should not have called onSearch yet
    expect(onSearch).not.toHaveBeenCalled();
    
    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be called only once with final value
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Amazing'
        })
      );
    });
  });

  it('cancels previous debounced calls when new input arrives', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch onSearch={onSearch} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    // First input
    await user.type(input, 'First');
    act(() => vi.advanceTimersByTime(200)); // Not enough to trigger
    
    // Clear and type second input
    await user.clear(input);
    await user.type(input, 'Second');
    
    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should only be called once with the second value
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Second'
        })
      );
    });
  });

  it('handles keyboard shortcuts correctly', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    // Press Escape to clear
    await user.keyboard('{Escape}');
    
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('updates URL parameters when syncWithUrl is enabled', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it('shows filter count badge when filters are active', () => {
    const initialFilters: Partial<SearchFilters> = {
      key: ['C', 'G'],
      difficulty: ['beginner']
    };
    
    render(
      <TestWrapper>
        <SongSearch 
          initialFilters={initialFilters}
          showFilterButton={true}
          onFilterClick={() => {}}
        />
      </TestWrapper>
    );

    // Should show count of 2 active filters (key and difficulty)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows "Clear all filters" button when filters are active', () => {
    const initialFilters: Partial<SearchFilters> = {
      query: 'test',
      difficulty: ['beginner']
    };
    
    render(
      <TestWrapper>
        <SongSearch initialFilters={initialFilters} />
      </TestWrapper>
    );

    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('clears all filters when "Clear all filters" is clicked', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    
    const initialFilters: Partial<SearchFilters> = {
      query: 'test',
      difficulty: ['beginner']
    };
    
    render(
      <TestWrapper>
        <SongSearch initialFilters={initialFilters} onSearch={onSearch} />
      </TestWrapper>
    );

    const clearAllButton = screen.getByText('Clear all filters');
    await user.click(clearAllButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          difficulty: undefined
        })
      );
    });
  });

  it('maintains focus on input after clearing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input).toHaveFocus();
  });

  it('applies proper ARIA labels for accessibility', () => {
    render(
      <TestWrapper>
        <SongSearch showFilterButton={true} onFilterClick={() => {}} />
      </TestWrapper>
    );

    const input = screen.getByLabelText('Search songs');
    const filterButton = screen.getByLabelText(/show filters/i);
    
    expect(input).toBeInTheDocument();
    expect(filterButton).toBeInTheDocument();
  });

  it('handles focus and blur events correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SongSearch />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    // Focus should add focus styles
    await user.click(input);
    expect(input).toHaveFocus();
    
    // Blur should remove focus
    await user.tab();
    expect(input).not.toHaveFocus();
  });
});