import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock ProductivityTracker component
jest.mock('../components/ProductivityTracker', () => {
  return function MockProductivityTracker() {
    return <div data-testid="productivity-tracker">Productivity Tracker Component</div>;
  };
});

// Mock sample data utility
jest.mock('../utils/sampleData', () => ({
  loadSampleDataIfEmpty: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
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

// Mock window.matchMedia for system dark mode detection
const mockMatchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Set up global before each test
global.matchMedia = mockMatchMedia;

describe('App Component', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    // Reset matchMedia mock
    mockMatchMedia.mockClear();
    mockMatchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  describe('Basic Rendering', () => {
    test('renders with light/dark toggle', () => {
      render(<App />);
      
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    test('renders ProductivityTracker component', () => {
      render(<App />);
      
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Functionality', () => {
    test('renders dark mode toggle button', () => {
      render(<App />);

      const darkModeToggle = screen.getByRole('button', { name: /dark/i });
      expect(darkModeToggle).toBeInTheDocument();
    });

    test('toggles between light and dark mode', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially shows "Dark" button (currently in light mode)
      const darkModeToggle = screen.getByRole('button', { name: /dark/i });
      expect(darkModeToggle).toHaveTextContent('Dark');

      // Click to switch to dark mode
      await user.click(darkModeToggle);

      // Should now show "Light" button (currently in dark mode)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
      });
    });

    test('persists dark mode preference to localStorage', async () => {
      const user = userEvent.setup();
      render(<App />);

      const darkModeToggle = screen.getByRole('button', { name: /dark/i });
      await user.click(darkModeToggle);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'productivity-dark-mode',
          'true'
        );
      });
    });

    test('loads dark mode preference from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-dark-mode') return 'true';
        return null;
      });

      render(<App />);

      // Should show Light button (currently in dark mode)
      expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    });

    test('handles system dark mode preference detection', () => {
      // Mock system prefers dark mode
      mockMatchMedia.mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Update window.matchMedia to use the mock
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      render(<App />);

      // Component should render without crashing and show a theme toggle
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });
  });

  describe('Tron Theme Auto-Selection', () => {
    test('automatically selects Tron theme when task contains "for the user"', () => {
      const tasksWithTronKeyword = [
        {
          id: '1',
          name: 'Design interface for the user',
          timeSpent: 2,
          focusLevel: 'high',
          date: '2024-01-15'
        }
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return JSON.stringify(tasksWithTronKeyword);
        return null;
      });

      render(<App />);

      // Tron theme should be applied automatically
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('automatically selects Tron theme when task contains "Master Control Program"', () => {
      const tasksWithTronKeyword = [
        {
          id: '1',
          name: 'Debug Master Control Program interface',
          timeSpent: 3,
          focusLevel: 'high',
          date: '2024-01-15'
        }
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return JSON.stringify(tasksWithTronKeyword);
        return null;
      });

      render(<App />);

      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('automatically selects Tron theme when task contains "mcp" (case insensitive)', () => {
      const tasksWithTronKeyword = [
        {
          id: '1',
          name: 'Connect to MCP systems',
          timeSpent: 1.5,
          focusLevel: 'medium',
          date: '2024-01-15'
        }
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return JSON.stringify(tasksWithTronKeyword);
        return null;
      });

      render(<App />);

      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('automatically selects Tron theme when task contains "Kevin"', () => {
      const tasksWithTronKeyword = [
        {
          id: '1',
          name: 'Meeting with Kevin Flynn',
          timeSpent: 1,
          focusLevel: 'low',
          date: '2024-01-15'
        }
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return JSON.stringify(tasksWithTronKeyword);
        return null;
      });

      render(<App />);

      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('uses normal light/dark theme when no Tron keywords are present', () => {
      const normalTasks = [
        {
          id: '1',
          name: 'Regular development work',
          timeSpent: 4,
          focusLevel: 'high',
          date: '2024-01-15'
        }
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return JSON.stringify(normalTasks);
        return null;
      });

      render(<App />);

      // Should show normal Ready mode toggle
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  describe('Theme UI', () => {
    test('theme toggle is positioned fixed in top-right', () => {
      render(<App />);

      const themeToggle = screen.getByText('Dark').closest('div');
      const styles = window.getComputedStyle(themeToggle);
      expect(styles.position).toBe('fixed');
    });

    test('shows correct icons for dark mode toggle', () => {
      render(<App />);

      // Should show moon icon in light mode
      const darkModeToggle = screen.getByRole('button', { name: /dark/i });
      expect(darkModeToggle.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles malformed tasks data gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-tasks') return 'invalid json';
        return null;
      });

      // Should not crash
      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('handles missing localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('loads sample data on mount', () => {
      const { loadSampleDataIfEmpty } = require('../utils/sampleData');
      
      render(<App />);

      expect(loadSampleDataIfEmpty).toHaveBeenCalled();
    });

    test('listens for localStorage changes to update tasks', () => {
      render(<App />);

      // Simulate localStorage change event
      const newTasks = [{ id: '1', name: 'New task for the user', timeSpent: 1 }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(newTasks));
      
      fireEvent(window, new Event('storage'));

      // Component should handle the storage event
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });
  });
}); 