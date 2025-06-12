import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import TaskForm from '../components/TaskManager/TaskForm';
import { themes } from '../themes/themes';

// Mock DOMPurify for testing
jest.mock('dompurify', () => ({
  sanitize: jest.fn((input) => {
    // Simple mock - remove script tags and dangerous content
    return input.replace(/<script.*?>.*?<\/script>/gi, '')
                .replace(/<.*?>/g, '')
                .replace(/javascript:/gi, '');
  })
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

describe('Input Validation and XSS Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Name Validation', () => {
    test('validates task name length - minimum', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      // Try to submit empty task
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();
      });

      expect(mockAddTask).not.toHaveBeenCalled();
    });

    test('validates task name length - maximum', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const longText = 'a'.repeat(201); // 201 characters

      await user.type(taskInput, longText);
      
      await waitFor(() => {
        expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();
      });
    });

    test('accepts valid task name length', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);

      await user.type(taskInput, 'Valid task name');
      await user.type(hoursInput, '2');

      // Should not show validation error
      expect(screen.queryByText('Task name must be 1-200 characters')).not.toBeInTheDocument();
    });

    test('sanitizes XSS attempts in task name', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      // Try to inject script
      const maliciousInput = '<script>alert("xss")</script>Task name';
      await user.type(taskInput, maliciousInput);
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Task name', // Should be sanitized
            time_spent: 2,
            focus_level: 'medium',
            date_worked: '2024-01-01'
          }),
          '2024-01-01'
        );
      });
    });

    test('sanitizes HTML tags in task name', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      const htmlInput = '<div>Task <b>name</b></div>';
      await user.type(taskInput, htmlInput);
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Task name', // HTML tags should be stripped
          }),
          '2024-01-01'
        );
      });
    });
  });

  describe('Hours Validation', () => {
    test('validates hours minimum value', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const hoursInput = screen.getByLabelText(/hours spent/i);
      
      await user.type(hoursInput, '-1');
      
      await waitFor(() => {
        expect(screen.getByText('Hours must be between 0 and 24')).toBeInTheDocument();
      });
    });

    test('validates hours maximum value', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const hoursInput = screen.getByLabelText(/hours spent/i);
      
      await user.type(hoursInput, '25');
      
      await waitFor(() => {
        expect(screen.getByText('Hours must be between 0 and 24')).toBeInTheDocument();
      });
    });

    test('accepts valid hours', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const hoursInput = screen.getByLabelText(/hours spent/i);
      
      await user.type(hoursInput, '8');
      
      // Should not show validation error
      expect(screen.queryByText('Hours must be between 0 and 24')).not.toBeInTheDocument();
    });

    test('prevents form submission with invalid hours', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      await user.type(taskInput, 'Valid task');
      await user.type(hoursInput, '30');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Hours must be between 0 and 24')).toBeInTheDocument();
      });

      expect(mockAddTask).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Validation', () => {
    test('shows validation errors in real-time', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      
      // Type long text
      const longText = 'a'.repeat(201);
      await user.type(taskInput, longText);

      await waitFor(() => {
        expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();
      });

      // Clear and type valid text
      await user.clear(taskInput);
      await user.type(taskInput, 'Valid task');

      await waitFor(() => {
        expect(screen.queryByText('Task name must be 1-200 characters')).not.toBeInTheDocument();
      });
    });

    test('displays validation errors with red border', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);

      // Invalid task name
      await user.type(taskInput, 'a'.repeat(201));
      
      await waitFor(() => {
        expect(taskInput).toHaveStyle({ borderColor: '#dc2626' });
      });

      // Invalid hours
      await user.type(hoursInput, '30');
      
      await waitFor(() => {
        expect(hoursInput).toHaveStyle({ borderColor: '#dc2626' });
      });
    });
  });

  describe('Form Submission Security', () => {
    test('sanitizes data before sending to API', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      // Input with potential XSS
      await user.type(taskInput, 'javascript:alert("xss") Task name');
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'alert("xss") Task name', // javascript: should be removed
            time_spent: 2,
          }),
          '2024-01-01'
        );
      });
    });

    test('enforces maxLength attribute on inputs', () => {
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      expect(taskInput).toHaveAttribute('maxLength', '200');
    });

    test('clears validation errors on successful submission', async () => {
      const user = userEvent.setup();
      renderTaskForm();

      const taskInput = screen.getByLabelText(/describe the task/i);
      const hoursInput = screen.getByLabelText(/hours spent/i);
      const submitButton = screen.getByRole('button', { name: /add task/i });

      // First, create validation errors
      await user.type(taskInput, 'a'.repeat(201));
      await user.type(hoursInput, '30');

      await waitFor(() => {
        expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();
        expect(screen.getByText('Hours must be between 0 and 24')).toBeInTheDocument();
      });

      // Clear and enter valid data
      await user.clear(taskInput);
      await user.clear(hoursInput);
      await user.type(taskInput, 'Valid task');
      await user.type(hoursInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Task name must be 1-200 characters')).not.toBeInTheDocument();
        expect(screen.queryByText('Hours must be between 0 and 24')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode Validation', () => {
    test('validates when editing existing task', async () => {
      const user = userEvent.setup();
      const editingTask = {
        id: 1,
        name: 'Original task',
        time_spent: 2,
        focus_level: 'high'
      };

      renderTaskForm({ editingTask });

      const taskInput = screen.getByLabelText(/describe the task/i);
      const submitButton = screen.getByRole('button', { name: /update/i });

      // Clear and enter invalid data
      await user.clear(taskInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Task name must be 1-200 characters')).toBeInTheDocument();
      });

      expect(mockUpdateTask).not.toHaveBeenCalled();
    });
  });
});