import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

const today_timestamp = new Date().toISOString();
const today_date = today_timestamp.split('T')[0];
const sampleTasks = [
  {
    id: '1',
    name: 'Code review',
    timeSpent: 2.5,
    focusLevel: 'high',
    completed: true,
    date: today_date,
    timestamp: today_timestamp
  },
  {
    id: '2',
    name: 'Meeting prep',
    timeSpent: 1.0,
    focusLevel: 'medium',
    completed: true,
    date: today_date,
    timestamp: today_timestamp
  },
  {
    id: '3',
    name: 'Documentation',
    timeSpent: 3.0,
    focusLevel: 'low',
    completed: false,
    date: today_date,
    timestamp: today_timestamp
  }
];

const mockLocalStorage = (() => {
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
  // Ensure matchMedia is properly mocked for this specific render call
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  const result = render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );

  // Restore original
  window.matchMedia = originalMatchMedia;
  
  return result;
};

describe('Visualizations Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chart Rendering', () => {
    test('renders daily productivity bar chart with data', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      // Verify chart has data
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      expect(chartData.length).toBeGreaterThan(0);
      
      // Check for chart elements
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getAllByTestId('bar')).toHaveLength(3); // Low, Medium, High focus bars
    });

    test('renders focus analysis chart', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });

      // Verify pie chart elements
      expect(screen.getByTestId('pie')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    test('renders responsive containers for all charts', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      await waitFor(() => {
        const responsiveContainers = screen.getAllByTestId('responsive-container');
        expect(responsiveContainers.length).toBeGreaterThanOrEqual(2); // Bar chart + Pie chart
      });
    });
  });

  describe('Statistics Cards', () => {
    test('displays overview statistics', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      // Check for the actual labels in the component
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getAllByText('Tasks')).toHaveLength(2); // Stat label + button
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('Focus')).toBeInTheDocument();
    });

    test('displays focus-level statistics', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      // Check for focus level stats
      expect(screen.getAllByText(/low focus/i)).toHaveLength(2); // Card title + legend
      expect(screen.getAllByText(/medium focus/i)).toHaveLength(2); // Card title + legend
      expect(screen.getAllByText(/high focus/i)).toHaveLength(2); // Card title + legend
    });

    test('calculates statistics correctly', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      // With 2 sample tasks (2.5h + 1.0h = 3.5h total)
      await waitFor(() => {
        const pieChart = screen.getByTestId('pie-chart');
        const chartData = JSON.parse(pieChart.getAttribute('data-chart-data') || '[]');
        
        // Should have focus level data
        if (chartData.length > 0) {
          const focusLevels = chartData.map(item => item.name || item.focusLevel);
          expect(focusLevels).toContain('high');
        }
      
        expect(screen.getByText(sampleTasks.length.toString())).toBeInTheDocument(); // Total tasks
        expect(screen.getByText((content, element) => {
          return element?.textContent === `${sampleTasks.reduce((sum, task) => sum + task.timeSpent, 0)}h`;
        })).toBeInTheDocument(); // Total hours with 'h' suffix
      });
    });
  });

  describe('Section Headers', () => {
    test('renders all section titles', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByText(/daily productivity/i)).toBeInTheDocument();
      expect(screen.getByText(/focus level distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/productivity per day/i)).toBeInTheDocument();
      expect(screen.getByText(/productivity per hour/i)).toBeInTheDocument();
    });

    test('includes section descriptions', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByText(/the number of tasks you completed/i)).toBeInTheDocument();
      expect(screen.getByText(/understand your focus patterns/i)).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    test('processes tasks data correctly for charts', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      // Should have daily data points
      expect(chartData.length).toBeGreaterThan(0);
      expect(chartData[0]).toHaveProperty('date');
      expect(chartData[0]).toHaveProperty('low');
      expect(chartData[0]).toHaveProperty('medium');
      expect(chartData[0]).toHaveProperty('high');
    });

    test('handles focus level distribution correctly', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      // Should render all focus levels in the pie chart
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Interactive Controls', () => {
    test('includes time range controls', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
    });

    test('includes view toggle for tasks vs time', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByRole('button', { name: 'Tasks' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Time' })).toBeInTheDocument();
    });

    test('can switch between task and time view modes', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      const timeButton = screen.getByRole('button', { name: 'Time' });
      fireEvent.click(timeButton);

      // Should still show the chart after switching
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    test('handles empty data gracefully', () => {
      renderWithTheme(<Visualizations tasks={[]} />);

      // Should render without crashing
      expect(screen.getByText(/daily productivity/i)).toBeInTheDocument();
      expect(screen.getByText(/focus level distribution/i)).toBeInTheDocument();
    });

    test('displays correct statistics with no tasks', () => {
      renderWithTheme(<Visualizations tasks={[]} />);

      // Should show zero values - use more specific selectors
      expect(screen.getByText('0')).toBeInTheDocument(); // Total tasks
      // There are multiple "0.0h" elements, so we just check that at least one exists
      expect(screen.getAllByText((content, element) => {
        return element?.textContent === '0.0h';
      })).toHaveLength(7); // Multiple focus level stats show 0.0h
    });
  });

  describe('Theme Compatibility', () => {
    test('renders correctly with all themes', () => {
      const themesToTest = ['Ready', 'Ready-Dark', 'Tron'];

      themesToTest.forEach(themeName => {
        const { unmount } = renderWithTheme(<Visualizations tasks={sampleTasks} />, themes[themeName]);
        
        // Should render main sections
        expect(screen.getByText(/daily productivity/i)).toBeInTheDocument();
        expect(screen.getByText(/focus level distribution/i)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Heatmap Components', () => {
    test('renders daily productivity heatmap', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByText(/productivity per day/i)).toBeInTheDocument();
      expect(screen.getByText(/visual overview of your daily productivity/i)).toBeInTheDocument();
    });

    test('renders hourly productivity heatmap', async () => {
      renderWithTheme(<Visualizations tasks={sampleTasks} />);

      expect(screen.getByText(/productivity per hour/i)).toBeInTheDocument();
      expect(screen.getByText(/identify your most productive hours/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles malformed task data', () => {
      const malformedTasks = [
        { id: '1', name: 'Incomplete task' }, // Missing required fields
        { id: '2' } // Minimal data
      ];
      
      // Should not crash
      expect(() => {
        renderWithTheme(<Visualizations tasks={malformedTasks} />);
      }).not.toThrow();
    });

    test('handles invalid focus levels', () => {
      const invalidTasks = [
        { ...sampleTasks[0], focusLevel: 'invalid' },
        { ...sampleTasks[1], focusLevel: null }
      ];
      
      expect(() => {
        renderWithTheme(<Visualizations tasks={invalidTasks} />);
      }).not.toThrow();
    });
  });
}); 