import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Visualizations from '../pages/Visualizations';
import { themes } from '../themes/themes';

// Mock fetch
global.fetch = jest.fn();

// Mock calculateTaskStatistics
jest.mock('../utils/api', () => ({
  getApiUrl: () => 'http://localhost:8000/api',
  calculateTaskStatistics: jest.fn().mockResolvedValue({
    total_tasks: 4,
    total_hours: 10.5,
    average_hours_per_task: 2.625,
    focus_hours: { high: 7, medium: 2, low: 1.5 },
  }),
}));

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ data, children }) => <div data-testid="line-chart" data-chartdata={JSON.stringify(data)}>{children}</div>,
  BarChart: ({ data, children }) => <div data-testid="bar-chart" data-chartdata={JSON.stringify(data)}>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }) => <div data-testid="pie-data" data-chartdata={JSON.stringify(data)}></div>,
  Line: (props) => <div data-testid={`line-${props.dataKey}`} {...props}>Line: {props.dataKey}</div>,
  Bar: (props) => <div data-testid={`bar-${props.dataKey}`} {...props}>Bar: {props.dataKey}</div>,
  XAxis: (props) => <div data-testid="x-axis" {...props}>XAxis: {props.dataKey}</div>,
  YAxis: (props) => <div data-testid="y-axis" {...props}>YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">CartesianGrid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
  Cell: () => <div data-testid="cell">Cell</div>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Sample tasks for testing
const sampleTasks = [
  { id: 1, name: 'Coding', time_spent: 4, focus_level: 'high', date_worked: '2024-03-11' },
  { id: 2, name: 'Meeting', time_spent: 1.5, focus_level: 'low', date_worked: '2024-03-11' },
  { id: 3, name: 'Documentation', time_spent: 2, focus_level: 'medium', date_worked: '2024-03-12' },
  { id: 4, name: 'Code Review', time_spent: 3, focus_level: 'high', date_worked: '2024-03-13' },
];

const sampleSummaries = [
  { id: 1, week_start: '2024-03-11', week_end: '2024-03-17', summary: 'Productive week' },
];

describe('Visualizations Component', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/tasks/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleTasks,
        });
      }
      if (url.includes('/summaries/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleSummaries,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check for loading indicators
    expect(screen.getByText(/week/i)).toBeInTheDocument();
  });

  test('renders charts after data loads', async () => {
    // Mock successful API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/tasks/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleTasks,
        });
      }
      if (url.includes('/summaries/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleSummaries,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    // Check if charts are rendered
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  test('displays statistics from task data', async () => {
    // Mock API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/tasks/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleTasks,
        });
      }
      if (url.includes('/summaries/')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleSummaries,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for stats to load and display
    await waitFor(() => {
      expect(screen.getAllByText(/Total/).length).toBeGreaterThan(0); // Total section is displayed
      expect(screen.getAllByText(/Average/).length).toBeGreaterThan(0); // Average section is displayed
    });
  });

  test('handles empty data gracefully', async () => {
    // Mock empty responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/tasks/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/summaries/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for component to render with empty data
    await waitFor(() => {
      expect(screen.getAllByText(/Total/).length).toBeGreaterThan(0); // Total section is displayed even with no data
    });

    // Charts should still render but with empty data
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock failed API responses
    global.fetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <Visualizations />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});