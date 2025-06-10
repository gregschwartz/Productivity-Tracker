import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import TaskManager from '../pages/TaskManager';
import { themes } from '../themes/themes';

// Mock fetch
global.fetch = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-calendar
jest.mock('react-calendar', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-mock">Calendar Mock</div>,
}));

describe('TaskManager Component', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders TaskManager with form and task list areas', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/describe the task/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/describe the task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours spent/i)).toBeInTheDocument();
    expect(screen.getByText(/focus level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  test('adds a new task and displays it', async () => {
    const user = userEvent.setup();
    
    // Mock initial load (empty array)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    // Mock successful task creation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'New Test Task',
        time_spent: 1.5,
        focus_level: 'medium',
        date_worked: '2024-03-15',
      }),
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/describe the task/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/describe the task/i), 'New Test Task');
    await user.type(screen.getByLabelText(/hours spent/i), '1.5');
    
    // Click on medium focus button
    const mediumButton = screen.getByRole('button', { name: /medium/i });
    await user.click(mediumButton);

    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"name":"New Test Task"'),
        })
      );
    });
  });

  test('loads and displays tasks from API on initial render', async () => {
    const mockTasks = [
      { id: 1, name: 'Loaded Task 1', time_spent: 2, focus_level: 'high', date_worked: '2024-03-14' },
      { id: 2, name: 'Loaded Task 2', time_spent: 1, focus_level: 'low', date_worked: '2024-03-13' },
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks,
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/loaded task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/loaded task 2/i)).toBeInTheDocument();
    });
  });

  test('edits an existing task', async () => {
    const user = userEvent.setup();
    const initialTask = {
      id: 1,
      name: 'Original Task',
      time_spent: 1,
      focus_level: 'low',
      date_worked: '2024-03-10',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [initialTask],
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/original task/i)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByTitle('Edit task');
    await user.click(editButton);

    // Form should be populated with task data
    expect(screen.getByLabelText(/describe the task/i)).toHaveValue('Original Task');
    expect(screen.getByLabelText(/hours spent/i)).toHaveValue(1);

    // Update task
    await user.clear(screen.getByLabelText(/describe the task/i));
    await user.type(screen.getByLabelText(/describe the task/i), 'Updated Task');

    // Mock successful update
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...initialTask,
        name: 'Updated Task',
      }),
    });

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/updated task/i)).toBeInTheDocument();
    });
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    const mockTask = {
      id: 1,
      name: 'Task To Delete',
      time_spent: 1,
      focus_level: 'medium',
      date_worked: '2024-03-10',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTask],
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/task to delete/i)).toBeInTheDocument();
    });

    // Mock successful deletion
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Task deleted successfully' }),
    });

    // Click delete button
    const deleteButton = screen.getByTitle('Delete task');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/task to delete/i)).not.toBeInTheDocument();
    });
  });

  test('displays appropriate visual styling for focus level', async () => {
    const mockTasks = [
      { id: 1, name: 'High Focus Task', time_spent: 1, focus_level: 'high', date_worked: '2024-03-16' },
      { id: 2, name: 'Low Focus Task', time_spent: 2, focus_level: 'low', date_worked: '2024-03-17' },
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks,
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const highFocusCard = screen.getByText(/high focus task/i).closest('[data-testid="task-card"]');
      expect(highFocusCard).toHaveAttribute('data-focus-level', 'high');

      const lowFocusCard = screen.getByText(/low focus task/i).closest('[data-testid="task-card"]');
      expect(lowFocusCard).toHaveAttribute('data-focus-level', 'low');
    });
  });

  test('loads only today tasks when no selectedDate provided, not all tasks', async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    render(
      <BrowserRouter>
        <ThemeProvider theme={themes.Ready}>
          <TaskManager selectedDate={null} />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should call API with date filter for today, not load all tasks
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`start_date=${today}&end_date=${tomorrowString}`)
      );
      // Should NOT call API without date filter (which would load all tasks)
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.not.stringContaining('start_date')
      );
    });
  });
});