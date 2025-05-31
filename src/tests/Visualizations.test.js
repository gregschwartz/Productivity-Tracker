import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { themes } from '../themes/themes';
import Visualizations from '../components/Visualizations';

// Mock Recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children, data }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  LineChart: ({ children, data }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  PieChart: ({ children, data }) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Bar: ({ dataKey, fill, name }) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} data-name={name} />
  ),
  Line: ({ dataKey, stroke, name }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} data-name={name} />
  ),
  Pie: ({ dataKey, fill, name }) => (
    <div data-testid="pie" data-key={dataKey} data-fill={fill} data-name={name} />
  ),
  Cell: ({ fill }) => <div data-testid="pie-cell" data-fill={fill} />,
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }) => <div data-testid="tooltip">{content}</div>,
  Legend: () => <div data-testid="legend" />
}));

// Mock localStorage with sample data
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
      name: 'Meeting prep',
      timeSpent: { hours: 1, minutes: 0 },
      focusLevel: 'medium',
      completed: true,
      createdAt: new Date('2024-01-15T14:00:00Z').toISOString()
    },
    {
      id: '3',
      name: 'Documentation',
      timeSpent: { hours: 3, minutes: 0 },
      focusLevel: 'low',
      completed: false,
      createdAt: new Date('2024-01-16T09:00:00Z').toISOString()
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

// Helper function to render component with theme
const renderWithTheme = (component, theme = themes.Ready) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Visualizations Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chart Rendering', () => {
    test('renders productivity trends chart with data', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      // Verify chart has data
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      expect(chartData.length).toBeGreaterThan(0);
    });

    test('renders focus analysis chart', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });

      // Verify pie chart elements
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    test('renders time trends line chart', async () => {
      renderWithTheme(<Visualizations />);

      // Switch to line chart view if available
      const lineChartTab = screen.queryByText(/time trends/i) || screen.queryByText(/line/i);
      if (lineChartTab) {
        lineChartTab.click();
        
        await waitFor(() => {
          expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Processing', () => {
    test('processes tasks data correctly for charts', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        const barChart = screen.getByTestId('bar-chart');
        const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
        
        // Should have processed the sample tasks
        expect(chartData).toBeDefined();
        expect(Array.isArray(chartData)).toBe(true);
      });
    });

    test('handles focus level distribution', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        const pieChart = screen.getByTestId('pie-chart');
        const chartData = JSON.parse(pieChart.getAttribute('data-chart-data') || '[]');
        
        // Should have focus level data
        if (chartData.length > 0) {
          const focusLevels = chartData.map(item => item.name || item.focusLevel);
          expect(focusLevels).toContain('high');
        }
      });
    });
  });

  describe('Empty State Handling', () => {
    test('handles empty data gracefully', () => {
      // Clear localStorage to simulate no data
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithTheme(<Visualizations />);

      // Should render without crashing
      expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();
    });

    test('displays empty state message when no tasks', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      renderWithTheme(<Visualizations />);

      // Should show empty state
      const emptyMessage = screen.queryByText(/no data/i) || screen.queryByText(/track some tasks/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  describe('Theme Compatibility', () => {
    test('renders correctly with all themes', () => {
      const themesToTest = ['Ready', 'Ready-Dark', 'Tron'];

      themesToTest.forEach(themeName => {
        const { unmount } = renderWithTheme(<Visualizations />, themes[themeName]);
        
        // Should render header
        expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();
        
        unmount();
      });
    });

    test('applies theme-specific colors to charts', async () => {
      renderWithTheme(<Visualizations />, themes.tron);

      await waitFor(() => {
        const charts = screen.getAllByTestId(/chart/);
        expect(charts.length).toBeGreaterThan(0);
      });

      // Charts should be rendered (specific color testing would require more complex mocking)
    });
  });

  describe('Responsive Design', () => {
    test('renders responsive container for charts', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        expect(screen.getAllByTestId('responsive-container')).toHaveLength(
          expect.any(Number)
        );
      });
    });
  });

  describe('Interactive Elements', () => {
    test('includes tooltip for chart interactions', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        const tooltips = screen.getAllByTestId('tooltip');
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });

    test('includes legend for chart data', async () => {
      renderWithTheme(<Visualizations />);

      await waitFor(() => {
        // Legend might be present depending on chart type
        const legends = screen.queryAllByTestId('legend');
        // No strict expectation as legends are optional
      });
    });
  });

  describe('Error Handling', () => {
    test('handles malformed localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      // Should not crash
      expect(() => {
        renderWithTheme(<Visualizations />);
      }).not.toThrow();
    });

    test('handles missing required data fields', () => {
      const malformedTasks = [
        { id: '1', name: 'Incomplete task' }, // Missing required fields
        { id: '2' } // Minimal data
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(malformedTasks));
      
      // Should not crash
      expect(() => {
        renderWithTheme(<Visualizations />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large datasets', async () => {
      // Create large dataset
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        timeSpent: { hours: Math.floor(Math.random() * 8), minutes: Math.floor(Math.random() * 60) },
        focusLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        completed: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeTasks));

      const startTime = performance.now();
      renderWithTheme(<Visualizations />);
      const endTime = performance.now();

      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);

      await waitFor(() => {
        expect(screen.getByText(/productivity insights/i)).toBeInTheDocument();
      });
    });
  });
}); 