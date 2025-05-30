import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { themes } from '../themes/themes';
import TaskManager from '../components/TaskManager';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
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

// Helper function to render component with theme
const renderWithTheme = (component, theme = themes.elegant) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('TaskManager Component', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Task Creation', () => {
    test('TC1.1: Add a New Task', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Fill in task details
      const taskNameInput = screen.getByPlaceholderText(/what did you work on/i);
      await user.type(taskNameInput, 'Design new logo');

      const timeInput = screen.getByLabelText(/time spent/i);
      await user.type(timeInput, '2.5');

      const highFocusButton = screen.getByRole('button', { name: /high/i });
      await user.click(highFocusButton);

      // Save task
      const saveButton = screen.getByRole('button', { name: /add task/i });
      await user.click(saveButton);

      // Verify onAddTask was called with correct data
      expect(mockOnAddTask).toHaveBeenCalledWith({
        name: 'Design new logo',
        timeSpent: 2.5,
        focusLevel: 'high'
      });

      // Verify form is reset
      expect(taskNameInput.value).toBe('');
      expect(timeInput.value).toBe('');
    });

    test('TC1.2: Quick Task Entry', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Only enter task name
      const taskNameInput = screen.getByPlaceholderText(/what did you work on/i);
      await user.type(taskNameInput, 'Quick task');

      const timeInput = screen.getByLabelText(/time spent/i);
      await user.type(timeInput, '0.5');

      const saveButton = screen.getByRole('button', { name: /add task/i });
      await user.click(saveButton);

      // Verify onAddTask was called with defaults
      expect(mockOnAddTask).toHaveBeenCalledWith({
        name: 'Quick task',
        timeSpent: 0.5,
        focusLevel: 'medium' // default focus level
      });
    });

    test('TC1.5: Attempt to Add Task with Invalid Data', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Try to save without task name
      const saveButton = screen.getByRole('button', { name: /add task/i });
      await user.click(saveButton);

      // Should not call onAddTask due to HTML5 validation
      expect(mockOnAddTask).not.toHaveBeenCalled();

      // Try with just task name but no time
      const taskNameInput = screen.getByPlaceholderText(/what did you work on/i);
      await user.type(taskNameInput, 'Test task');
      
      await user.click(saveButton);
      
      // Should still not call onAddTask due to missing time
      expect(mockOnAddTask).not.toHaveBeenCalled();
    });
  });

  describe('Task Management', () => {
    test('TC1.3: Delete a Task', async () => {
      const user = userEvent.setup();
      const mockOnDeleteTask = jest.fn();
      
      const sampleTasks = [{
        id: '1',
        name: 'Task to delete',
        timeSpent: 1,
        focusLevel: 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      renderWithTheme(<TaskManager tasks={sampleTasks} onDeleteTask={mockOnDeleteTask} />);

      // Verify task is displayed
      expect(screen.getByText('Task to delete')).toBeInTheDocument();

      // Click delete button
      const deleteButton = screen.getByTitle('Delete task');
      await user.click(deleteButton);

      // Verify onDeleteTask was called
      expect(mockOnDeleteTask).toHaveBeenCalledWith('1');
    });
  });

  describe('Data Persistence', () => {
    test('TC1.6: Data Persistence on Refresh', async () => {
      const user = userEvent.setup();

      // Simulate existing data that would be loaded by parent component
      const sampleTasks = [
        {
          id: '1',
          name: 'Persisted task',
          timeSpent: 1.5,
          focusLevel: 'high',
          completed: false,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      // Render component with tasks as props (simulating parent component loading from localStorage)
      renderWithTheme(<TaskManager tasks={sampleTasks} />);

      // Verify task is displayed
      await waitFor(() => {
        expect(screen.getByText('Persisted task')).toBeInTheDocument();
        expect(screen.getByText(/1.5 hours/)).toBeInTheDocument();
      });
    });

    test('TC3.1: Extended Persistence Test', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Add multiple tasks
      for (let i = 1; i <= 3; i++) {
        const taskNameInput = screen.getByPlaceholderText(/what did you work on/i);
        await user.type(taskNameInput, `Task ${i}`);

        const timeInput = screen.getByLabelText(/time spent/i);
        await user.type(timeInput, '1');

        const saveButton = screen.getByRole('button', { name: /add task/i });
        await user.click(saveButton);

        // Verify each task was added
        expect(mockOnAddTask).toHaveBeenCalledWith({
          name: `Task ${i}`,
          timeSpent: 1,
          focusLevel: 'medium'
        });
      }

      // Verify all tasks were added
      expect(mockOnAddTask).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Styling', () => {
    test('TC2.1: Task Display Styling', () => {
      const sampleTasks = [
        {
          id: '1',
          name: 'High focus task',
          timeSpent: 2,
          focusLevel: 'high',
          completed: false,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Completed task',
          timeSpent: 1,
          focusLevel: 'medium',
          completed: true,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ];

      renderWithTheme(<TaskManager tasks={sampleTasks} />);

      // Verify tasks are displayed
      expect(screen.getByText('High focus task')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();

      // Verify time badges
      expect(screen.getByText(/2 hours/)).toBeInTheDocument();
      expect(screen.getByText(/1 hour/)).toBeInTheDocument();

      // Verify focus level styling (check for focus level indicators)
      const highFocusTask = screen.getByText('High focus task').closest('[data-testid]');
      const completedTask = screen.getByText('Completed task').closest('[data-testid]');

      expect(highFocusTask).toHaveAttribute('data-focus-level', 'high');
      expect(completedTask).toHaveAttribute('data-completed', 'true');
    });

    test('TC2.2: Cross-Theme Styling', () => {
      const sampleTask = [{
        id: '1',
        name: 'Theme test task',
        timeSpent: 1,
        focusLevel: 'high',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      // Test with different themes
      const themesToTest = ['elegant', 'ready', 'readyAlt', 'tron'];

      themesToTest.forEach(themeName => {
        const { unmount } = renderWithTheme(<TaskManager tasks={sampleTask} />, themes[themeName]);
        
        // Verify task is rendered with theme
        expect(screen.getByText('Theme test task')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Empty State', () => {
    test('Empty state display', () => {
      renderWithTheme(<TaskManager />);

      // Should show empty state message
      expect(screen.getByText(/no tasks yet today/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first task to start tracking/i)).toBeInTheDocument();
    });
  });
}); 