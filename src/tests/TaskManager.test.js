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

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function MockCalendar({ value, onChange }) {
    return (
      <div data-testid="mock-calendar">
        <button onClick={() => onChange(new Date('2024-01-15'))}>
          Mock Calendar
        </button>
      </div>
    );
  };
});

// Mock CSS imports
jest.mock('react-calendar/dist/Calendar.css', () => {});

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
const renderWithTheme = (component, theme = themes.Ready) => {
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

      const timeInput = screen.getByLabelText(/hours spent/i);
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
      }, expect.any(String));

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

      const timeInput = screen.getByLabelText(/hours spent/i);
      await user.type(timeInput, '0.5');

      const saveButton = screen.getByRole('button', { name: /add task/i });
      await user.click(saveButton);

      // Verify onAddTask was called with defaults
      expect(mockOnAddTask).toHaveBeenCalledWith({
        name: 'Quick task',
        timeSpent: 0.5,
        focusLevel: 'medium' // default focus level
      }, expect.any(String));
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

    test('TC1.4: Edit a Task', async () => {
      const user = userEvent.setup();
      const mockOnUpdateTask = jest.fn();
      
      const sampleTasks = [{
        id: '1',
        name: 'Task to edit',
        timeSpent: 2,
        focusLevel: 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      renderWithTheme(<TaskManager tasks={sampleTasks} onUpdateTask={mockOnUpdateTask} />);

      // Verify task is displayed
      expect(screen.getByText('Task to edit')).toBeInTheDocument();

      // Click edit button
      const editButton = screen.getByTitle('Edit task');
      await user.click(editButton);

      // Verify form is populated with task data
      const taskNameInput = screen.getByDisplayValue('Task to edit');
      const timeInput = screen.getByDisplayValue('2');
      const mediumFocusButton = screen.getByRole('button', { name: /medium/i });

      expect(taskNameInput).toBeInTheDocument();
      expect(timeInput).toBeInTheDocument();
      expect(mediumFocusButton).toHaveAttribute('aria-pressed', 'true');

      // Verify button text changed to "Update"
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Edit the task
      await user.clear(taskNameInput);
      await user.type(taskNameInput, 'Updated task name');
      
      await user.clear(timeInput);
      await user.type(timeInput, '3.5');

      const highFocusButton = screen.getByRole('button', { name: /high/i });
      await user.click(highFocusButton);

      // Save changes
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      // Verify onUpdateTask was called with correct data
      expect(mockOnUpdateTask).toHaveBeenCalledWith('1', {
        name: 'Updated task name',
        timeSpent: 3.5,
        focusLevel: 'high'
      });

      // Verify form is reset and back to create mode
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    test('TC1.5: Cancel Edit Task', async () => {
      const user = userEvent.setup();
      const mockOnUpdateTask = jest.fn();
      
      const sampleTasks = [{
        id: '1',
        name: 'Task to edit',
        timeSpent: 2,
        focusLevel: 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      renderWithTheme(<TaskManager tasks={sampleTasks} onUpdateTask={mockOnUpdateTask} />);

      // Click edit button
      const editButton = screen.getByTitle('Edit task');
      await user.click(editButton);

      // Verify we're in edit mode
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Make some changes
      const taskNameInput = screen.getByDisplayValue('Task to edit');
      await user.clear(taskNameInput);
      await user.type(taskNameInput, 'Changed name');

      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify we're back to create mode
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

      // Verify form is reset
      const resetTaskNameInput = screen.getByPlaceholderText(/what did you work on/i);
      expect(resetTaskNameInput.value).toBe('');

      // Verify onUpdateTask was not called
      expect(mockOnUpdateTask).not.toHaveBeenCalled();
    });

    test('TC1.6: Edit Task Visual Highlighting', async () => {
      const user = userEvent.setup();
      
      const sampleTasks = [{
        id: '1',
        name: 'Task to edit',
        timeSpent: 2,
        focusLevel: 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      renderWithTheme(<TaskManager tasks={sampleTasks} />);

      // Click edit button
      const editButton = screen.getByTitle('Edit task');
      await user.click(editButton);

      // Verify task card has editing visual state
      const taskCard = screen.getByText('Task to edit').closest('[data-testid="task-card"]');
      expect(taskCard).toHaveAttribute('data-editing', 'true');
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

        const timeInput = screen.getByLabelText(/hours spent/i);
        await user.type(timeInput, '1');

        const saveButton = screen.getByRole('button', { name: /add task/i });
        await user.click(saveButton);

        // Verify each task was added
        expect(mockOnAddTask).toHaveBeenCalledWith({
          name: `Task ${i}`,
          timeSpent: 1,
          focusLevel: 'medium'
        }, expect.any(String));
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
      const themesToTest = ['Ready', 'Ready-Dark', 'Tron'];

      themesToTest.forEach(themeName => {
        const { unmount } = renderWithTheme(<TaskManager tasks={sampleTask} />, themes[themeName]);
        
        // Verify task is rendered with theme
        expect(screen.getByText('Theme test task')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    test('TC4.1: Tab Order', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TaskManager />);

      // The first input should already have focus due to autoFocus
      expect(screen.getByPlaceholderText(/what did you work on/i)).toHaveFocus();

      // Test tab order: task name -> time -> focus level -> submit button
      await user.tab();
      expect(screen.getByLabelText(/hours spent/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /medium/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /add task/i })).toHaveFocus();
    });

    test('TC4.2: Focus Level Keyboard Navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TaskManager />);

      // Focus on the focus level selector
      const lowButton = screen.getByRole('button', { name: /low/i });
      lowButton.focus();

      // Test arrow key navigation
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: /medium/i })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: /high/i })).toHaveFocus();

      // Test wrapping
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: /low/i })).toHaveFocus();

      // Test left arrow
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('button', { name: /high/i })).toHaveFocus();
    });

    test('TC4.3: Focus Level Space/Enter Selection', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Fill required fields
      await user.type(screen.getByPlaceholderText(/what did you work on/i), 'Test task');
      await user.type(screen.getByLabelText(/hours spent/i), '1');

      // Focus on high focus level and select with space
      const highButton = screen.getByRole('button', { name: /high/i });
      highButton.focus();
      await user.keyboard(' ');

      // Submit form
      await user.click(screen.getByRole('button', { name: /add task/i }));

      expect(mockOnAddTask).toHaveBeenCalledWith({
        name: 'Test task',
        timeSpent: 1,
        focusLevel: 'high'
      }, expect.any(String));
    });

    test('TC4.4: Edit Mode Tab Order', async () => {
      const user = userEvent.setup();
      const sampleTasks = [{
        id: '1',
        name: 'Task to edit',
        timeSpent: 2,
        focusLevel: 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }];

      renderWithTheme(<TaskManager tasks={sampleTasks} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Edit task');
      await user.click(editButton);

      // Focus the task name input manually since edit doesn't auto-focus
      const taskNameInput = screen.getByDisplayValue('Task to edit');
      taskNameInput.focus();

      // Test tab order in edit mode: task name -> time -> focus level -> update -> cancel
      expect(screen.getByDisplayValue('Task to edit')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByDisplayValue('2')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /medium/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /update/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });
  });

  describe('Form Behavior', () => {
    test('TC5.1: Form Reset After Successful Submission', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Fill form
      await user.type(screen.getByPlaceholderText(/what did you work on/i), 'Test task');
      await user.type(screen.getByLabelText(/hours spent/i), '2.5');
      await user.click(screen.getByRole('button', { name: /high/i }));

      // Submit
      await user.click(screen.getByRole('button', { name: /add task/i }));

      // Verify form is reset
      expect(screen.getByPlaceholderText(/what did you work on/i).value).toBe('');
      expect(screen.getByLabelText(/hours spent/i).value).toBe('');
      // Verify medium is selected as default focus level
      expect(screen.getByRole('button', { name: /medium/i })).toHaveAttribute('aria-pressed', 'true');
    });

    test('TC5.2: Form Validation', async () => {
      const user = userEvent.setup();
      const mockOnAddTask = jest.fn();
      renderWithTheme(<TaskManager onAddTask={mockOnAddTask} />);

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /add task/i }));
      expect(mockOnAddTask).not.toHaveBeenCalled();

      // Add task name but no time
      await user.type(screen.getByPlaceholderText(/what did you work on/i), 'Test task');
      await user.click(screen.getByRole('button', { name: /add task/i }));
      expect(mockOnAddTask).not.toHaveBeenCalled();

      // Add time and submit
      await user.type(screen.getByLabelText(/hours spent/i), '1');
      await user.click(screen.getByRole('button', { name: /add task/i }));
      expect(mockOnAddTask).toHaveBeenCalled();
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