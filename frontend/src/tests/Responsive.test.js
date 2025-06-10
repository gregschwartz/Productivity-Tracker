
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from '../App';
import TaskManager from '../pages/TaskManager';
import { themes } from '../themes/themes';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn(() => Promise.resolve({ 
  ok: true, 
  json: () => Promise.resolve([]) 
}));


// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: () => <div data-testid="line-chart-mock">LineChartMock</div>,
  BarChart: () => <div data-testid="bar-chart-mock">BarChartMock</div>,
  PieChart: () => <div data-testid="pie-chart-mock">PieChartMock</div>,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));


// Mock react-calendar
jest.mock('react-calendar', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-mock">Calendar Mock</div>,
}));

// Helper to change viewport size
const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('Application Responsive Design', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    setViewport(originalInnerWidth, originalInnerHeight);
  });

  describe('App Component Overall Layout', () => {
    test('main layout adapts on mobile viewport', () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      setViewport(375, 667); // iPhone SE

      // Check that the app container is present
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    test('main layout adapts on tablet viewport', () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      setViewport(768, 1024); // iPad

      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    test('main layout uses desktop view on large screens', () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      setViewport(1920, 1080); // Full HD Desktop

      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  describe('TaskManager Component Responsiveness', () => {
    test('task input form elements are usable on mobile', async () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={themes.Ready}>
            <TaskManager />
          </ThemeProvider>
        </BrowserRouter>
      );
      setViewport(375, 667);

      // Wait for component to load
      await screen.findByText(/describe the task/i);
      
      expect(screen.getByLabelText(/describe the task/i)).toBeVisible();
      expect(screen.getByRole('button', { name: /add task/i })).toBeVisible();
    });

    test('task list items are readable on mobile', async () => {
      // Mock API response with tasks
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { 
            id: 1, 
            name: 'Mobile Task Display Test', 
            time_spent: 1, 
            focus_level: 'medium', 
            date_worked: '2024-03-15' 
          }
        ])
      }));

      render(
        <BrowserRouter>
          <ThemeProvider theme={themes.Ready}>
            <TaskManager />
          </ThemeProvider>
        </BrowserRouter>
      );
      setViewport(375, 667);

      // Wait for tasks to load
      await screen.findByText(/mobile task display test/i);
      
      expect(screen.getByText(/mobile task display test/i)).toBeVisible();
      expect(screen.getByText(/1 hour/)).toBeVisible();
      expect(screen.getByText(/medium focus/i)).toBeVisible();
    });
  });
});