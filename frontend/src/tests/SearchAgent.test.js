import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchAgent from '../components/SearchAgent'; // Assuming this is the correct path
// No specific context provider is assumed for SearchAgent unless it manages global search state.
// If SearchAgent is a simple component making a fetch call, it might not need a dedicated provider.

// Mock localStorage (if search history or results are cached, though not specified)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for API calls
global.fetch = jest.fn();

// Sample API response for RAG search
const mockSearchApiResponse = [ // Assuming the API returns an array of summary-like objects
  {
    id: 'summary1',
    week_start: '2024-01-08',
    week_end: '2024-01-14',
    summary: 'This week focused on improving code review efficiency.',
    // relevance_score: 0.95, // Optional, if API provides it
  },
  {
    id: 'summary2',
    week_start: '2024-01-15',
    week_end: '2024-01-21',
    summary: 'Explored new strategies for better time management during coding.',
    // relevance_score: 0.88, // Optional
  }
];

// Mock RAG response structure from backend if it's different, e.g. { results: [], answer: "..." }
// For now, assuming the endpoint `GET /api/summaries?query=...` returns a list of WeeklySummary objects.
// If `SearchAgent` calls a specific RAG endpoint like `/api/rag/search` that returns `RAGResponse`
// (as per `conftest.py` `sample_rag_response`), then `mockSearchApiResponse` should match that.
// Let's adjust to match `RAGResponse` for consistency with backend capabilities.
const mockRagSearchApiResponse = {
    results: [
        {
            content: "Week 2024-01-08 to 2024-01-14: High focus on code reviews resulted in better quality",
            source: "Week 2024-01-08", // Or summary ID
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
    answer: "Based on your history, maintaining high focus during code reviews has led to better quality outcomes." // Optional generative answer
};


describe('SearchAgent Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch.mockReset(); // Reset fetch mock
    global.fetch.mockResolvedValue({ // Default success
        ok: true,
        json: () => Promise.resolve([]) // Default to empty results
    });
  });

  test('renders search input and a search button', () => {
    render(<SearchAgent />);
    expect(screen.getByRole('searchbox', { name: /search past summaries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('allows typing a query into the search input', async () => {
    const user = userEvent.setup();
    render(<SearchAgent />);
    const searchInput = screen.getByRole('searchbox', { name: /search past summaries/i });
    await user.type(searchInput, 'how to improve focus');
    expect(searchInput).toHaveValue('how to improve focus');
  });

  test('clicking search button triggers API call with the query and shows loading', async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementationOnce(() => new Promise(() => {})); // Pending promise for loading state

    render(<SearchAgent />);
    const searchInput = screen.getByRole('searchbox', { name: /search past summaries/i });
    await user.type(searchInput, 'productivity tips');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      // The RAG search endpoint might be /api/summaries?query=... or a specific /api/rag/search
      // Based on previous backend tests, /api/summaries?query=... is likely.
      // Let's assume SearchAgent uses this convention.
      expect.stringContaining('/api/summaries?query=productivity%20tips'), // URL encoded
      // Or if it's a POST to a RAG endpoint:
      // expect.stringContaining('/api/rag/search'),
      // expect.objectContaining({ method: 'POST', body: JSON.stringify({ query: 'productivity tips' }) })
      expect.anything() // For now, just check the URL part
    );

    expect(screen.getByText(/searching.../i)).toBeInTheDocument(); // Or other loading indicator
  });

  test('displays search results after successful API call', async () => {
    const user = userEvent.setup();
    // Assuming the API returns RAGResponse structure
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRagSearchApiResponse.results), // If endpoint returns just the results array
      // Or if it returns the full RAGResponse object:
      // json: () => Promise.resolve(mockRagSearchApiResponse),
    });

    render(<SearchAgent />);
    const searchInput = screen.getByRole('searchbox', { name: /search past summaries/i });
    await user.type(searchInput, 'focus techniques');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      // Check for content from each result item
      expect(screen.getByText(mockRagSearchApiResponse.results[0].content)).toBeInTheDocument();
      expect(screen.getByText(mockRagSearchApiResponse.results[1].content)).toBeInTheDocument();
    });

    // If there's a generative answer part displayed:
    // if (mockRagSearchApiResponse.answer) {
    //   expect(screen.getByText(mockRagSearchApiResponse.answer)).toBeInTheDocument();
    // }

    expect(screen.queryByText(/searching.../i)).not.toBeInTheDocument();
  });

  test('displays "no results found" message if API returns empty list', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]), // Empty array for no results
      // Or for RAGResponse: json: () => Promise.resolve({ results: [], answer: null }),
    });

    render(<SearchAgent />);
    const searchInput = screen.getByRole('searchbox', { name: /search past summaries/i });
    await user.type(searchInput, 'unknown query');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no relevant summaries found/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/searching.../i)).not.toBeInTheDocument();
  });

  test('handles API error during search', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Error searching summaries' }),
    });

    render(<SearchAgent />);
    const searchInput = screen.getByRole('searchbox', { name: /search past summaries/i });
    await user.type(searchInput, 'trigger error');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/error searching summaries/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/searching.../i)).not.toBeInTheDocument();
  });
});

// Notes:
// - Assumes `SearchAgent.js` component exists at `../components/SearchAgent`.
// - The search input is identified by `role='searchbox'` and an accessible name.
// - The search button is identified by `role='button'` and name `/search/i`.
// - Loading state text is assumed to be `/searching.../i`.
// - No results message is assumed to be `/no relevant summaries found/i`.
// - Error message display is assumed based on API error response.
// - The exact API endpoint and request/response structure for search (RAG) needs to match
//   the backend implementation. The test currently expects the endpoint to be
//   `/api/summaries?query=...` (GET request) and the response to be an array of results
//   (or a RAGResponse object containing a `results` array).
//   If the backend uses `POST /api/rag/search` as suggested by `test_rag_router.py`'s original prompt,
//   the fetch mock and assertion should be updated.
//   The `mockRagSearchApiResponse` is structured like `RAGResponse` from `conftest.py`.
//   The test for displaying results has been adapted to expect the component to render `result.content`.
// - `localStorage` is mocked but not explicitly used in these tests, as the prompt
//   didn't specify caching search results or history for this component.
// - This component is key for "test that weekly summaries and suggestions are stored in a vector store
//   and that the agent can accurately search for past weeks" PRD item, by testing the search part.
//   The "stored in vector store" is a backend concern.
// - The display of search results (e.g., just content, or content + source + score) depends on
//   the `SearchAgent` component's rendering logic. The test currently checks for `result.content`.
//   It could be more specific, e.g. `screen.getByText(/high focus on code reviews/i)`.
// - If the component paginates results or has advanced filters, those would require additional tests.
//   The current tests cover basic query, display, no results, and error handling.
// - The URL encoding `productivity%20tips` in the fetch assertion is important for GET requests.
//   `encodeURIComponent('productivity tips')` would produce this.
// - The `expect.anything()` for the second argument to fetch in the loading test is a placeholder.
//   It should ideally be `expect.objectContaining({ method: 'GET' })` or similar if it's a GET.
//   If it's a POST, it would be `expect.objectContaining({ method: 'POST', body: ... })`.
//   The current test `displays search results after successful API call` mocks fetch to return
//   `mockRagSearchApiResponse.results`. If the component expects the full `RAGResponse` object
//   (i.e., `{ results: [], answer: "..." }`), then the mock should be `json: () => Promise.resolve(mockRagSearchApiResponse)`.
//   I have updated the mock in that test to provide `mockRagSearchApiResponse.results` directly for simplicity,
//   assuming the component primarily cares about the list of documents. This can be easily adjusted.
//   If the component also displays the `answer` field from `RAGResponse`, that part of the test should be enabled.
// - For the API call assertion `expect.stringContaining('/api/summaries?query=productivity%20tips')`,
//   this assumes the `SearchAgent` component constructs this URL for a GET request.
//   If it makes a POST request to `/api/rag/search`, the assertion would be:
//   `expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/rag/search'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ query: 'productivity tips', max_results: 5 }) }))`
//   (assuming `max_results` or other params are sent).
//   I'll keep it as GET /api/summaries?query= for now, as it aligns with `test_summary_router.py` and `test_rag_router.py` which point to this existing endpoint.
//   The `SearchAgent` component itself would be responsible for `encodeURIComponent` on the query.
// - The `mockSearchApiResponse` (array of summaries) was replaced by `mockRagSearchApiResponse` (RAGResponse object)
//   to better align with the backend RAG capabilities shown in `conftest.py`.
//   The tests are now adjusted to work with `mockRagSearchApiResponse.results`.
