import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import SearchAgent from '../pages/SearchAgent';
import { themes } from '../themes/themes';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Sample API response for search endpoint - array of WeeklySummary objects
const mockSearchApiResponse = [
  {
    id: 1,
    week_start: "2024-01-08",
    week_end: "2024-01-14", 
    summary: "High focus on code reviews resulted in better quality",
    stats: { total_tasks: 5, total_hours: "40.0", avg_focus: "high" },
    recommendations: ["Continue high focus approach"],
  },
  {
    id: 2,
    week_start: "2024-01-15", 
    week_end: "2024-01-21",
    summary: "Medium focus tasks took longer than expected",
    stats: { total_tasks: 3, total_hours: "35.0", avg_focus: "medium" },
    recommendations: ["Try to improve focus level"],
  }
];

describe('SearchAgent Component', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  test('renders search input', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/productivity history/i)).toBeInTheDocument();
    // 1 Input with placeholder that has both of these pieces of text: "productivity patterns" and "search" 
    expect(screen.getByPlaceholderText(/productivity patterns/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('allows typing a query into the search input', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'how to improve focus');
    expect(searchInput).toHaveValue('how to improve focus');
  });

  test('Typing in search box triggers API call with the query', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'code');
    
    // Wait for the debounced API call (300ms delay)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/summaries/search?query=code')
      );
    }, { timeout: 1000 });
  });

  test('displays search results after successful API call', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchApiResponse),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'code');

    await waitFor(() => {
      // Check for results count
      expect(screen.getByText(/2 results found/i)).toBeInTheDocument();
      
      // Check for search results content
      expect(screen.getByText(/high focus on code reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/medium focus tasks took longer/i)).toBeInTheDocument();
    });
  });

  test('displays "no results found" message if API returns empty results', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'unknown query');

    await waitFor(() => {
      expect(screen.getByText(/no matching weeks found/i)).toBeInTheDocument();
    });
  });

  test('handles API error during search', async () => {
    const user = userEvent.setup();
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'trigger error');

    await waitFor(() => {
      // Should show error message, not fallback to local search
      expect(screen.getByText(/error performing search/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});