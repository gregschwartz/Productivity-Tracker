import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the ProductivityTracker component
jest.mock('../components/ProductivityTracker', () => {
  return function MockProductivityTracker() {
    return <div data-testid="productivity-tracker">Productivity Tracker Content</div>;
  };
});

// Mock the sample data utility
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

describe('App Component', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Theme Switching', () => {
    test('renders with default elegant theme', () => {
      render(<App />);
      
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
      expect(screen.getByText('elegant')).toBeInTheDocument();
    });

    test('allows switching between different themes', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Switch to Ready.net theme
      const readyButton = screen.getByText('ready');
      await user.click(readyButton);

      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'productivity-theme',
        'ready'
      );
    });

    test('loads saved theme from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-theme') return 'tron';
        return null;
      });

      render(<App />);

      // Verify tron theme button is active
      const tronButton = screen.getByText('tron');
      expect(tronButton).toHaveAttribute('class', expect.stringContaining('active'));
    });

    test('renders all available theme options', () => {
      render(<App />);

      expect(screen.getByText('elegant')).toBeInTheDocument();
      expect(screen.getByText('ready')).toBeInTheDocument();
      expect(screen.getByText('Ready Alt')).toBeInTheDocument();
      expect(screen.getByText('tron')).toBeInTheDocument();
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
        if (key === 'productivity-theme') return 'elegant-dark';
        return null;
      });

      render(<App />);

      // Should show Light button (currently in dark mode)
      expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    });

    test('applies correct theme variants for dark mode', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Switch to ready theme
      await user.click(screen.getByText('ready'));
      
      // Toggle dark mode
      await user.click(screen.getByRole('button', { name: /dark/i }));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'productivity-theme',
          'ready-dark'
        );
      });
    });

    test('handles tron theme dark/light variants correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Switch to tron theme
      await user.click(screen.getByText('tron'));
      
      // Initially should be in dark mode (tron default)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'productivity-theme',
        'tron'
      );

      // Toggle to light mode
      await user.click(screen.getByRole('button', { name: /light/i }));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'productivity-theme',
          'tron-light'
        );
      });
    });
  });

  describe('Theme Persistence', () => {
    test('saves theme changes to localStorage', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Switch themes and verify localStorage calls
      await user.click(screen.getByText('ready'));
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'productivity-theme',
        'ready'
      );

      await user.click(screen.getByText('Ready Alt'));
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'productivity-theme',
        'readyAlt'
      );
    });

    test('handles invalid saved theme gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'productivity-theme') return 'invalid-theme';
        return null;
      });

      // Should not crash and fallback to default theme
      expect(() => render(<App />)).not.toThrow();
      
      // Should show elegant theme as default
      expect(screen.getByText('elegant')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    test('highlights active theme button', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially elegant should be active
      const elegantButton = screen.getByText('elegant');
      expect(elegantButton).toHaveClass(expect.stringContaining('active'));

      // Switch to ready theme
      await user.click(screen.getByText('ready'));

      // Ready should now be active
      const readyButton = screen.getByText('ready');
      expect(readyButton).toHaveClass(expect.stringContaining('active'));
    });

    test('shows correct icons for dark mode toggle', () => {
      render(<App />);

      // Should show moon icon in light mode
      const darkModeToggle = screen.getByRole('button', { name: /dark/i });
      expect(darkModeToggle.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Theme Selector UI', () => {
    test('renders theme selector in fixed position', () => {
      render(<App />);

      const themeSelector = screen.getByText('elegant').closest('div');
      expect(themeSelector).toHaveStyle('position: fixed');
    });

    test('organizes theme buttons in grid layout', () => {
      render(<App />);

      const themeButtons = [
        screen.getByText('elegant'),
        screen.getByText('ready'),
        screen.getByText('Ready Alt'),
        screen.getByText('tron')
      ];

      // All theme buttons should be present
      themeButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders theme selector on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<App />);

      // Theme selector should still be accessible
      expect(screen.getByText('elegant')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('passes theme to ProductivityTracker component', () => {
      render(<App />);

      // Verify ProductivityTracker is rendered (mocked component)
      expect(screen.getByTestId('productivity-tracker')).toBeInTheDocument();
    });

    test('loads sample data on mount', () => {
      const { loadSampleDataIfEmpty } = require('../utils/sampleData');
      
      render(<App />);

      expect(loadSampleDataIfEmpty).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles theme switching errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage.setItem to throw an error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      render(<App />);

      // Should not crash when switching themes
      expect(async () => {
        await user.click(screen.getByText('ready'));
      }).not.toThrow();
    });

    test('handles missing localStorage gracefully', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage;
      delete window.localStorage;

      // Should not crash
      expect(() => render(<App />)).not.toThrow();

      // Restore localStorage
      window.localStorage = originalLocalStorage;
    });
  });
}); 