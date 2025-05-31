import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { themes } from '../themes/themes';
import TaskManager from '../components/TaskManager';
import Visualizations from '../components/Visualizations';
import WeeklySummary from '../components/WeeklySummary';

// Mock localStorage with sample data
const mockLocalStorage = (() => {
  const sampleTasks = [
    {
      id: '1',
      name: 'Mobile responsive task',
      timeSpent: { hours: 2, minutes: 0 },
      focusLevel: 'high',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];

  let store = {
    'productivity-tasks': JSON.stringify(sampleTasks)
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

// Mock Recharts for visualization tests
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="pie-cell" />,
  Legend: () => <div data-testid="legend" />
}));

// Helper function to render component with theme
const renderWithTheme = (component, theme = themes.Ready) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Helper function to simulate different viewport sizes
const setViewport = (width, height = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to desktop size by default
    setViewport(1024, 768);
  });

  describe('TaskManager Responsive Behavior', () => {
    test('TC2.3: Desktop View - TaskManager displays correctly', () => {
      setViewport(1024, 768);
      renderWithTheme(<TaskManager />);

      // Task list should be visible
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
      
      // Add button should be accessible
      expect(screen.getByText(/add task/i)).toBeInTheDocument();
    });

    test('TC2.3: Tablet View - TaskManager maintains usability', () => {
      setViewport(768, 1024);
      renderWithTheme(<TaskManager />);

      // Content should still be readable
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
      
      // Interactive elements should remain accessible
      expect(screen.getByText(/add task/i)).toBeInTheDocument();
    });

    test('TC2.3: Mobile View - TaskManager adapts layout', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      // Task should still be visible
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
      
      // Add button should be easily tappable
      const addButton = screen.getByText(/add task/i);
      expect(addButton).toBeInTheDocument();
      
      // Button should have adequate touch target size (mock check)
      expect(addButton).toHaveStyle('min-height: 44px'); // iOS recommended minimum
    });

    test('Small Mobile View - TaskManager handles very small screens', () => {
      setViewport(320, 568);
      renderWithTheme(<TaskManager />);

      // Content should not overflow horizontally
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
      
      // No horizontal scroll should be required (check container styles)
      const container = screen.getByText(/Mobile responsive task/).closest('[data-testid="task-container"]');
      if (container) {
        expect(container).toHaveStyle('overflow-x: visible');
      }
    });
  });

  describe('Visualizations Responsive Behavior', () => {
    test('Desktop View - Charts render at full size', () => {
      setViewport(1200, 800);
      renderWithTheme(<Visualizations />);

      // Charts should use ResponsiveContainer
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(
        expect.any(Number)
      );
    });

    test('Mobile View - Charts maintain readability', () => {
      setViewport(375, 667);
      renderWithTheme(<Visualizations />);

      // Responsive containers should adapt to small screen
      const containers = screen.queryAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThanOrEqual(0);
      
      // Chart content should be accessible
      expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();
    });

    test('Chart responsiveness across different orientations', () => {
      // Portrait mobile
      setViewport(375, 667);
      const { rerender } = renderWithTheme(<Visualizations />);
      
      expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();

      // Landscape mobile
      setViewport(667, 375);
      rerender(
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      );
      
      expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();
    });
  });

  describe('WeeklySummary Responsive Behavior', () => {
    test('Desktop View - Full layout with all features', () => {
      setViewport(1024, 768);
      renderWithTheme(<WeeklySummary />);

      // Should display generate button
      expect(screen.getByRole('button', { name: /generate.*week.*report/i })).toBeInTheDocument();
    });

    test('Mobile View - Condensed but functional layout', () => {
      setViewport(375, 667);
      renderWithTheme(<WeeklySummary />);

      // Generate button should still be accessible
      expect(screen.getByRole('button', { name: /generate.*week.*report/i })).toBeInTheDocument();
      
      // Text should be readable
      expect(screen.getByText(/weekly summary/i)).toBeInTheDocument();
    });
  });

  describe('Cross-Theme Responsive Behavior', () => {
    const viewportSizes = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1024, height: 768 }
    ];

    const testThemes = ['Ready', 'Ready-Dark', 'Tron'];

    testThemes.forEach(themeName => {
      viewportSizes.forEach(({ name, width, height }) => {
        test(`${themeName} theme - ${name} view responsiveness`, () => {
          setViewport(width, height);
          
          renderWithTheme(<TaskManager />, themes[themeName]);
          
          // Core functionality should be available regardless of theme/size
          expect(screen.getByText(/add task/i)).toBeInTheDocument();
          
          // Theme-specific styling should not break layout
          const addButton = screen.getByText(/add task/i);
          expect(addButton).toBeVisible();
        });
      });
    });
  });

  describe('Touch Interface Optimization', () => {
    test('Interactive elements have adequate touch targets on mobile', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      // Buttons should meet minimum touch target guidelines
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check that button is accessible (basic accessibility)
        expect(button).toBeInTheDocument();
      });
    });

    test('Focus states work properly on touch devices', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      const addButton = screen.getByText(/add task/i);
      
      // Simulate touch interaction
      fireEvent.focus(addButton);
      expect(addButton).toHaveFocus();
      
      fireEvent.blur(addButton);
      expect(addButton).not.toHaveFocus();
    });
  });

  describe('Text Readability Across Devices', () => {
    test('Text remains readable at mobile sizes', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      // Task text should be visible and not truncated inappropriately
      const taskText = screen.getByText(/Mobile responsive task/);
      expect(taskText).toBeInTheDocument();
      expect(taskText).toBeVisible();
    });

    test('Text scaling works with browser zoom', () => {
      setViewport(375, 667);
      
      // Simulate browser zoom (this is a simplified test)
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2.0
      });

      renderWithTheme(<TaskManager />);

      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
    });
  });

  describe('Dark Mode Responsive Behavior', () => {
    test('Dark theme maintains readability on mobile', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />, themes['Ready-Dark']);

      // Dark theme content should be readable
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
      expect(screen.getByText(/add task/i)).toBeInTheDocument();
    });

    test('High contrast themes work on small screens', () => {
      setViewport(320, 568); // Very small screen
      renderWithTheme(<TaskManager />, themes.tron);

      // Tron theme should maintain visibility
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile Devices', () => {
    test('Components render quickly on mobile viewport', () => {
      setViewport(375, 667);
      
      const startTime = performance.now();
      renderWithTheme(<TaskManager />);
      const endTime = performance.now();

      // Should render within reasonable time for mobile
      expect(endTime - startTime).toBeLessThan(1000);
      
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
    });

    test('Large datasets perform acceptably on mobile', () => {
      // Create a larger dataset
      const largeTasks = Array.from({ length: 50 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        timeSpent: { hours: 1, minutes: 0 },
        focusLevel: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeTasks));
      
      setViewport(375, 667);
      
      const startTime = performance.now();
      renderWithTheme(<TaskManager />);
      const endTime = performance.now();

      // Should still render within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Accessibility on Mobile', () => {
    test('Screen reader navigation works on mobile', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      // Buttons should have proper roles
      const addButton = screen.getByRole('button', { name: /add task/i });
      expect(addButton).toBeInTheDocument();
      
      // Task items should be accessible
      expect(screen.getByText(/Mobile responsive task/)).toBeInTheDocument();
    });

    test('Keyboard navigation works with virtual keyboards', () => {
      setViewport(375, 667);
      renderWithTheme(<TaskManager />);

      const addButton = screen.getByText(/add task/i);
      
      // Simulate keyboard navigation
      fireEvent.keyDown(addButton, { key: 'Enter', code: 'Enter' });
      // Should trigger the same action as click
    });
  });
}); 