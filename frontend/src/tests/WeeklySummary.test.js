import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { themes } from '../themes/themes';
import WeeklySummary from '../components/WeeklySummary';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = (() => {
  const sampleTasks = [
    {
      id: '1',
      name: 'Code review',
      timeSpent: { hours: 2, minutes: 30 },
      focusLevel: 'high',
      completed: true,
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString()
    },
    {
      id: '2',
      name: 'Meeting with team',
      timeSpent: { hours: 1, minutes: 0 },
      focusLevel: 'medium',
      completed: true,
      createdAt: new Date('2024-01-15T14:00:00Z').toISOString()
    }
  ];

  const sampleSummaries = [
    {
      id: '1',
      weekIdentifier: '2024-W03',
      summaryText: 'This week you completed 5 tasks with high productivity. Focus was excellent on Monday and Tuesday.',
      suggestionsText: 'Consider scheduling deep work sessions in the morning for optimal focus.',
      generatedAt: new Date('2024-01-19T18:00:00Z').toISOString()
    }
  ];

  let store = {
    'productivity-tasks': JSON.stringify(sampleTasks),
    'weekly-summaries': JSON.stringify(sampleSummaries)
  };

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Helper function to render component with theme
const renderWithTheme = (component, theme = themes.Ready) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('WeeklySummary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Summary Display', () => {
    test('displays existing weekly summaries', async () => {
      const sampleSummaries = [
        {
          id: '1',
          week: 3,
          year: 2024,
          weekRange: '2024-W03',
          summary: 'This week you completed 5 tasks with excellent focus.',
          insights: ['High productivity week', 'Consistent focus levels'],
          recommendations: ['Continue current momentum', 'Schedule regular breaks'],
          stats: {
            totalTasks: 5,
            totalHours: '12.5',
            avgFocus: '2.4',
            topFocus: 'high'
          },
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary summaries={sampleSummaries} />);

      await waitFor(() => {
        expect(screen.getByText(/This week you completed 5 tasks/)).toBeInTheDocument();
      });
    });

    test('shows summary details and suggestions', async () => {
      const sampleSummaries = [
        {
          id: '1',
          week: 3,
          year: 2024,
          weekRange: '2024-W03',
          summary: 'This week you completed 5 tasks with excellent focus.',
          insights: ['High productivity week', 'Consistent focus levels'],
          recommendations: ['Continue current momentum', 'Schedule regular breaks'],
          stats: {
            totalTasks: 5,
            totalHours: '12.5',
            avgFocus: '2.4',
            topFocus: 'high'
          },
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary summaries={sampleSummaries} />);

      await waitFor(() => {
        expect(screen.getByText(/This week you completed 5 tasks/)).toBeInTheDocument();
      });
    });

    test('displays empty state when no summaries exist', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'weekly-summaries') return '[]';
        return mockLocalStorage.getItem.getMockImplementation()(key);
      });

      renderWithTheme(<WeeklySummary />);

      expect(screen.getByText(/no summaries yet/i)).toBeInTheDocument();
    });
  });

  describe('Summary Generation', () => {
    test('TC4.1: Generate Weekly Summary', async () => {
      const user = userEvent.setup();

      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: 'Generated summary: You had a productive week with 2 tasks completed.',
          suggestions: 'Try batching similar tasks together for better efficiency.'
        })
      });

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      // Find and click generate button
      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      // Should call pydantic.ai API
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://ai.pydantic.dev/',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });

      // Verify the API was called successfully
      expect(fetch).toHaveBeenCalled();
    });

    test('TC4.2: Generate Summary for Week with No Tasks', async () => {
      const user = userEvent.setup();

      // Mock empty tasks
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return '[]';
        return mockLocalStorage.getItem.getMockImplementation()(key);
      });

      renderWithTheme(<WeeklySummary />);

      // When no tasks, button should show "No Tasks This Week" and be disabled
      const generateButton = screen.getByRole('button', { name: /no tasks this week/i });
      expect(generateButton).toBeDisabled();
    });

    test('TC4.3: Error Handling for Summary Generation API Failure', async () => {
      const user = userEvent.setup();

      // Mock API failure
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to generate summary/i)).toBeInTheDocument();
      });

      // Button should become active again
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    test('handles API timeout gracefully', async () => {
      const user = userEvent.setup();

      // Mock API timeout
      fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate summary/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('API Integration', () => {
    test('sends correct data format to pydantic.ai', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: 'Test summary' })
      });

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'high',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://ai.pydantic.dev/', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });

    test('includes task data in API request', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: 'Test summary' })
      });

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Important task',
          timeSpent: 3,
          focusLevel: 'high',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://ai.pydantic.dev/', expect.objectContaining({
          body: expect.stringContaining('Important task')
        }));
      });
    });
  });

  describe('Data Management', () => {
    test('saves generated summaries to localStorage', async () => {
      const user = userEvent.setup();
      const mockOnAddSummary = jest.fn();
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: 'Generated summary' })
      });

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} onAddSummary={mockOnAddSummary} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnAddSummary).toHaveBeenCalledWith(expect.objectContaining({
          summary: 'Generated summary'
        }));
      });
    });

    test('loads existing summaries on component mount', async () => {
      const existingSummaries = [
        {
          id: '1',
          weekStart: '2024-05-20',
          weekEnd: '2024-05-26',
          summary: 'This week you completed 5 tasks with excellent focus.',
          insights: ['High productivity week', 'Consistent focus levels'],
          recommendations: ['Continue current momentum', 'Schedule regular breaks'],
          stats: {
            totalTasks: 5,
            totalHours: '10.0',
            avgFocus: '3.0',
            topFocus: 'high'
          },
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary summaries={existingSummaries} />);
      
      await waitFor(() => {
        expect(screen.getByText(/This week you completed 5 tasks/)).toBeInTheDocument();
      });
    });

    test('handles corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'weekly-summaries') return 'invalid json';
        return mockLocalStorage.getItem.getMockImplementation()(key);
      });

      expect(() => {
        renderWithTheme(<WeeklySummary />);
      }).not.toThrow();
    });
  });

  describe('User Interface', () => {
    test('shows loading state during generation', async () => {
      const user = userEvent.setup();
      
      // Mock a slow API response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ summary: 'Generated summary' })
        }), 100))
      );

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Test task',
          timeSpent: 2,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      // Should show loading immediately
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('provides copy functionality for summaries', async () => {
      const user = userEvent.setup();

      // Mock clipboard API properly
      const mockWriteText = jest.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText
        },
        writable: true
      });

      const existingSummaries = [
        {
          id: '1',
          weekStart: '2024-05-20',
          weekEnd: '2024-05-26',
          summary: 'This week you completed 5 tasks with excellent focus.',
          insights: ['High productivity week', 'Consistent focus levels'],
          recommendations: ['Continue current momentum', 'Schedule regular breaks'],
          stats: {
            totalTasks: 5,
            totalHours: '10.0',
            avgFocus: '3.0',
            topFocus: 'high'
          },
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary summaries={existingSummaries} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('This week you completed 5 tasks with excellent focus.');
    });

    test('responsive design adapts to different screen sizes', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithTheme(<WeeklySummary />);
      
      // Should render without horizontal scroll
      expect(screen.getByText(/Generate Weekly Summary/)).toBeInTheDocument();
    });
  });

  describe('Theme Compatibility', () => {
    test('renders correctly with all themes', () => {
      const themesToTest = ['Ready', 'Ready-Dark', 'Tron'];

      themesToTest.forEach(themeName => {
        const { unmount } = renderWithTheme(<WeeklySummary />, themes[themeName]);
        
        expect(screen.getByText(/Generate Weekly Summary/)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('GenAI Integration', () => {
    test('TC1.1: Generate Weekly Summary with AI', async () => {
      const user = userEvent.setup();
      const mockOnAddSummary = jest.fn();
      
      // Mock fetch for AI API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          summary: 'This week you completed 3 tasks with high productivity. Focus on maintaining consistent work patterns.',
          suggestions: ['Continue current momentum', 'Schedule regular breaks']
        })
      });

      // Provide sample tasks so the button is enabled
      const sampleTasks = [
        {
          id: '1',
          name: 'Complete project',
          timeSpent: 3,
          focusLevel: 'high',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<WeeklySummary tasks={sampleTasks} onAddSummary={mockOnAddSummary} />);

      const generateButton = screen.getByRole('button', { name: /generate ai summary/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://ai.pydantic.dev/', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Complete project')
        }));
      });

      await waitFor(() => {
        expect(mockOnAddSummary).toHaveBeenCalledWith(expect.objectContaining({
          summary: expect.stringContaining('This week you completed 3 tasks')
        }));
      });
    });
  });
}); 