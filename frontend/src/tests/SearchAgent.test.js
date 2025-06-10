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

// Sample API response for RAG search
const mockRagSearchApiResponse = {
  results: [
    {
      content: "Week 2024-01-08 to 2024-01-14: High focus on code reviews resulted in better quality",
      source: "Week 2024-01-08",
      relevance_score: 0.95,
      metadata: { week_start: "2024-01-08", week_end: "2024-01-14" }
    },
    {
      content: "Week 2024-01-15 to 2024-01-21: Medium focus tasks took longer than expected",
      source: "Week 2024-01-15",
      relevance_score: 0.82,
      metadata: { week_start: "2024-01-15", week_end: "2024-01-21" }
    }
  ],
  answer: "Based on your history, maintaining high focus during code reviews has led to better quality outcomes."
};

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
    
    const searchInput = screen.getByText(/productivity history/i);
    await user.type(searchInput, 'how to improve focus');
    expect(searchInput).toHaveValue('how to improve focus');
  });

  test('Typing in search box  triggers API call with the query', async () => {
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

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summaries/rag/search'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ query: 'code reviews' }),
      })
    );
  });

  test('displays search results after successful API call', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRagSearchApiResponse),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'meeting');

    await waitFor(() => {
      // Check for the answer
      expect(screen.getByText(/based on your history/i)).toBeInTheDocument();
      
      // Check for results
      expect(screen.getByText(/high focus on code reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/medium focus tasks took longer/i)).toBeInTheDocument();
    });
  });

  test('displays "no results found" message if API returns empty results', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [], answer: null }),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/productivity history/i);
    await user.type(searchInput, 'unknown query');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no relevant summaries found/i)).toBeInTheDocument();
    });
  });

  test('handles API error during search', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <SearchAgent />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/productivity history/i);
    await user.type(searchInput, 'trigger error');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });
});