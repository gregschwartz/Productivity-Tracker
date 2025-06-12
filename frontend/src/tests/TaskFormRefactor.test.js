import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import TaskForm from '../components/TaskManager/TaskForm';
import { themes } from '../themes/themes';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((input) => input.replace(/<[^>]*>/g, ''))
}));

const mockAddTask = jest.fn();
const mockUpdateTask = jest.fn();
const mockOnEditComplete = jest.fn();

const renderTaskForm = (props = {}) => {
  const defaultProps = {
    addTask: mockAddTask,
    updateTask: mockUpdateTask,
    currentDateString: '2024-01-01',
    theme: 'Ready',
    editingTask: null,
    onEditComplete: mockOnEditComplete,
    resetTrigger: 0,
    ...props
  };

  return render(
    <ThemeProvider theme={themes.Ready}>
      <TaskForm {...defaultProps} />
    </ThemeProvider>
  );
};

describe('TaskForm Refactor - Proper React Patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prop-based API (No forwardRef)', () => {
    test('does not expose imperative methods', () => {
      const ref = React.createRef();
      
      render(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            ref={ref}
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={null}
            onEditComplete={mockOnEditComplete}
            resetTrigger={0}
          />
        </ThemeProvider>
      );

      // Ref should be null since we removed forwardRef
      expect(ref.current).toBeNull();
    });

    test('accepts editingTask prop to populate form', () => {
      const editingTask = {
        id: 1,
        name: 'Test Task',
        time_spent: 2.5,
        focus_level: 'high'
      };

      renderTaskForm({ editingTask });

      expect(screen.getByLabelText(/describe the task/i)).toHaveValue('Test Task');
      expect(screen.getByLabelText(/hours spent/i)).toHaveValue(2.5);
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    test('calls onEditComplete when task update is successful', async () => {
      const user = userEvent.setup();
      const editingTask = {
        id: 1,
        name: 'Original Task',
        time_spent: 2,
        focus_level: 'medium'
      };

      mockUpdateTask.mockResolvedValue({});

      renderTaskForm({ editingTask });

      const submitButton = screen.getByRole('button', { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnEditComplete).toHaveBeenCalledWith(1);
      });
    });

    test('calls onEditComplete with null when cancel is clicked', async () => {
      const user = userEvent.setup();
      const editingTask = {
        id: 1,
        name: 'Test Task',
        time_spent: 2,
        focus_level: 'medium'
      };

      renderTaskForm({ editingTask });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnEditComplete).toHaveBeenCalledWith(null);
    });

    test('responds to resetTrigger prop changes', () => {
      const { rerender } = renderTaskForm();

      // Fill form with data
      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      
      fireEvent.change(taskInput, { target: { value: 'Test task' } });
      fireEvent.change(hoursInput, { target: { value: '2' } });

      expect(taskInput).toHaveValue('Test task');
      expect(hoursInput).toHaveValue(2);

      // Trigger reset
      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={null}
            onEditComplete={mockOnEditComplete}
            resetTrigger={1}
          />
        </ThemeProvider>
      );

      expect(taskInput).toHaveValue('');
      expect(hoursInput).toHaveValue(null);
    });
  });

  describe('State Management', () => {
    test('manages form state internally', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);

      await user.type(taskInput, 'New task');
      await user.type(hoursInput, '3');

      expect(taskInput).toHaveValue('New task');
      expect(hoursInput).toHaveValue(3);
    });

    test('clears form state on successful submission', async () => {
      const user = userEvent.setup();
      mockAddTask.mockResolvedValue({});

      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      await user.type(taskInput, 'Test task');
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(taskInput).toHaveValue('');
        expect(hoursInput).toHaveValue(null);
      });
    });

    test('preserves form state on submission error', async () => {
      const user = userEvent.setup();
      mockAddTask.mockRejectedValue(new Error('Network error'));

      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      await user.type(taskInput, 'Test task');
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        // Form should retain values after error
        expect(taskInput).toHaveValue('Test task');
        expect(hoursInput).toHaveValue(2);
      });
    });
  });

  describe('Edit Mode Integration', () => {
    test('switches between create and edit modes', () => {
      const { rerender } = renderTaskForm();

      // Initially in create mode
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

      // Switch to edit mode
      const editingTask = {
        id: 1,
        name: 'Edit Task',
        time_spent: 1,
        focus_level: 'low'
      };

      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={editingTask}
            onEditComplete={mockOnEditComplete}
            resetTrigger={0}
          />
        </ThemeProvider>
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('populates form when editingTask changes', () => {
      const { rerender } = renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);

      expect(taskInput).toHaveValue('');
      expect(hoursInput).toHaveValue(null);

      // Set editing task
      const editingTask = {
        id: 1,
        name: 'Editing Task',
        time_spent: 4,
        focus_level: 'high'
      };

      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={editingTask}
            onEditComplete={mockOnEditComplete}
            resetTrigger={0}
          />
        </ThemeProvider>
      );

      expect(taskInput).toHaveValue('Editing Task');
      expect(hoursInput).toHaveValue(4);
    });

    test('clears validation errors when entering edit mode', () => {
      const { rerender } = renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      
      // Create validation error
      fireEvent.change(taskInput, { target: { value: 'a'.repeat(201) } });
      fireEvent.blur(taskInput);

      // Should show validation error
      expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();

      // Enter edit mode
      const editingTask = {
        id: 1,
        name: 'Valid Task',
        time_spent: 2,
        focus_level: 'medium'
      };

      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={editingTask}
            onEditComplete={mockOnEditComplete}
            resetTrigger={0}
          />
        </ThemeProvider>
      );

      // Validation error should be cleared
      expect(screen.queryByText('Task name must be 1-200 characters')).not.toBeInTheDocument();
    });
  });

  describe('Focus Level Integration', () => {
    test('updates focus level correctly', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      await user.type(taskInput, 'Focus test');
      await user.type(hoursInput, '1');

      // The default focus level should be 'medium'
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            focus_level: 'medium'
          }),
          '2024-01-01'
        );
      });
    });
  });

  describe('Component Lifecycle', () => {
    test('handles prop changes correctly', () => {
      const { rerender } = renderTaskForm();

      // Change multiple props
      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-02"
            theme="Ready-Dark"
            editingTask={null}
            onEditComplete={mockOnEditComplete}
            resetTrigger={1}
          />
        </ThemeProvider>
      );

      // Component should handle the changes without errors
      expect(screen.getByLabelText(/describe the task/i)).toBeInTheDocument();
    });

    test('maintains stable behavior across re-renders', () => {
      const { rerender } = renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      
      // Type something
      fireEvent.change(taskInput, { target: { value: 'Stable task' } });
      expect(taskInput).toHaveValue('Stable task');

      // Re-render with same props
      rerender(
        <ThemeProvider theme={themes.Ready}>
          <TaskForm
            addTask={mockAddTask}
            updateTask={mockUpdateTask}
            currentDateString="2024-01-01"
            theme="Ready"
            editingTask={null}
            onEditComplete={mockOnEditComplete}
            resetTrigger={0}
          />
        </ThemeProvider>
      );

      // Value should be preserved
      expect(taskInput).toHaveValue('Stable task');
    });
  });
});