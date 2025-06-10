import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import WeekSummary from '../components/WeekSummary';
import { themes } from '../themes/themes';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Sample test data
const mockTasks = [
  {
    id: 1,
    name: 'Development work',
    timeSpent: 4.5,
    focusLevel: 'high',
    date: '2024-03-11',
  },
  {
    id: 2,
    name: 'Code review',
    timeSpent: 2.0,
    focusLevel: 'medium',
    date: '2024-03-12',
  },
];

const mockSummary = {
  id: 1,
  week_start: '2024-03-11',
  week_end: '2024-03-17',
  summary: 'This was a productive week with good focus on development tasks.',
  recommendations: ['Continue high focus approach'],
  stats: {
    totalTasks: 5,
    totalHours: 20.5,
    avgFocus: 'high',
  },
  weekRange: 'Mar 11 - Mar 17, 2024',
  timestamp: '2024-03-17T23:59:00Z',
};

const mockTimeRange = {
  startDate: new Date('2024-03-11'),
  endDate: new Date('2024-03-17'),
};

describe('WeekSummary Component', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  test('renders weekly summary when provided', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={mockSummary}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/mar 11 - mar 17, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/this was a productive week/i)).toBeInTheDocument();
  });

  test('renders generate button when no summary exists', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={null}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /generate ai summary/i })).toBeInTheDocument();
  });

  test('generates summary when button clicked', async () => {
    const user = userEvent.setup();
    const mockOnAddSummary = jest.fn();
    
    // Mock successful generation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={null}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
            onAddSummary={mockOnAddSummary}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate ai summary/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/summaries/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  test('displays loading state during generation', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    let resolvePromise;
    global.fetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={null}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate ai summary/i }));

    // Check for loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();

    // Resolve the promise
    resolvePromise({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    });
  });

  test('handles generation error gracefully', async () => {
    const user = userEvent.setup();
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={null}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate ai summary/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
    });
  });

  test('displays task statistics when available', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <WeekSummary 
            tasks={mockTasks}
            summary={null}
            timeRange={mockTimeRange}
            contextSummaries={{ before: [], after: [] }}
          />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Should show task count and hours for the tasks provided
    expect(screen.getByText(/2 tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/6\.5h total/i)).toBeInTheDocument();
  });
});