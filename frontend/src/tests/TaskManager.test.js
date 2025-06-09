import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskManager from '../components/TaskManager'; // Assuming this is the correct path
import { TaskProvider } from '../contexts/TaskContext'; // Assuming a TaskContext manages tasks

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock API calls if TaskManager uses them directly (e.g., for a backend sync)
// For this test, we'll primarily focus on localStorage interactions as per the prompt.
// If TaskContext handles API calls, then those would be mocked when testing TaskContext or components using it.
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}), // Default mock fetch response
  })
);

// Wrapper for components needing TaskContext
const renderWithTaskProvider = (ui) => {
  return render(
    <TaskProvider>
      {ui}
    </TaskProvider>
  );
};

describe('TaskManager Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    global.fetch.mockClear();
  });

  test('renders TaskManager with form and task list areas', () => {
    renderWithTaskProvider(<TaskManager />);
    expect(screen.getByRole('form', { name: /task input form/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /task list/i })).toBeInTheDocument();
    // Check for input fields
    expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time spent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/focus level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  test('adds a new task, displays it, and calls localStorage.setItem', async () => {
    const user = userEvent.setup();
    renderWithTaskProvider(<TaskManager />);

    await user.type(screen.getByLabelText(/task name/i), 'New Test Task');
    await user.type(screen.getByLabelText(/time spent/i), '1.5');
    await user.selectOptions(screen.getByLabelText(/focus level/i), 'medium');
    await user.type(screen.getByLabelText(/date/i), '2024-03-15');

    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/new test task/i)).toBeInTheDocument();
      expect(screen.getByText(/1.5 hours/i)).toBeInTheDocument(); // Assuming display format
      expect(screen.getByText(/focus: medium/i)).toBeInTheDocument(); // Assuming display format
    });

    // Check if task item has a data attribute or class for focus level
    const taskItem = screen.getByText(/new test task/i).closest('li'); // Assuming tasks are in <li>
    expect(taskItem).toHaveAttribute('data-focus-level', 'medium');

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Or more depending on TaskContext implementation
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'tasks', // Assuming 'tasks' is the localStorage key
      expect.stringContaining('New Test Task')
    );
  });

  test('loads and displays tasks from localStorage on initial render', () => {
    const initialTasks = [
      { id: '1', name: 'Loaded Task 1', timeSpent: 2, focusLevel: 'high', date: '2024-03-14' },
      { id: '2', name: 'Loaded Task 2', timeSpent: 1, focusLevel: 'low', date: '2024-03-13' },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialTasks));

    renderWithTaskProvider(<TaskManager />);

    expect(screen.getByText(/loaded task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/loaded task 2/i)).toBeInTheDocument();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('tasks');
  });

  test('edits an existing task and updates display and localStorage', async () => {
    const user = userEvent.setup();
    const initialTasks = [
      { id: 'task-to-edit', name: 'Original Task', timeSpent: 1, focusLevel: 'low', date: '2024-03-10' },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialTasks));

    renderWithTaskProvider(<TaskManager />);

    // Wait for initial tasks to render
    await screen.findByText(/original task/i);

    // Click edit button for the task
    // Assuming edit button has a specific role or text, or is associated with the task item
    // For example, within the task item: <button aria-label="Edit Original Task">Edit</button>
    const editButton = screen.getByRole('button', { name: /edit original task/i });
    await user.click(editButton);

    // Form should be populated with task data
    // Input fields might have their names changed or be specifically for editing
    expect(screen.getByLabelText(/task name/i)).toHaveValue('Original Task');
    expect(screen.getByLabelText(/time spent/i)).toHaveValue(1);
    expect(screen.getByLabelText(/focus level/i)).toHaveValue('low');
    expect(screen.getByLabelText(/date/i)).toHaveValue('2024-03-10');

    // Change details
    await user.clear(screen.getByLabelText(/task name/i));
    await user.type(screen.getByLabelText(/task name/i), 'Updated Test Task');
    await user.clear(screen.getByLabelText(/time spent/i));
    await user.type(screen.getByLabelText(/time spent/i), '2.5');
    await user.selectOptions(screen.getByLabelText(/focus level/i), 'high');

    // Click the "Update Task" (or "Save Changes") button
    // The button text might change when in edit mode
    await user.click(screen.getByRole('button', { name: /update task/i }));

    await waitFor(() => {
      expect(screen.getByText(/updated test task/i)).toBeInTheDocument();
      expect(screen.getByText(/2.5 hours/i)).toBeInTheDocument();
      expect(screen.getByText(/focus: high/i)).toBeInTheDocument();
    });

    const taskItem = screen.getByText(/updated test task/i).closest('li');
    expect(taskItem).toHaveAttribute('data-focus-level', 'high');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'tasks',
      expect.stringContaining('Updated Test Task')
    );
    // Ensure original task text is gone
    expect(screen.queryByText(/original task/i)).not.toBeInTheDocument();
  });

  test('deletes a task and removes it from display and localStorage', async () => {
    const user = userEvent.setup();
    const initialTasks = [
      { id: 'task-to-delete', name: 'Task To Delete', timeSpent: 1, focusLevel: 'medium', date: '2024-03-10' },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialTasks));

    renderWithTaskProvider(<TaskManager />);

    await screen.findByText(/task to delete/i);

    // Click delete button for the task
    // Example: <button aria-label="Delete Task To Delete">Delete</button>
    const deleteButton = screen.getByRole('button', { name: /delete task to delete/i });
    await user.click(deleteButton);

    // Confirm deletion if there's a confirmation dialog (not assumed for this test)

    await waitFor(() => {
      expect(screen.queryByText(/task to delete/i)).not.toBeInTheDocument();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'tasks',
      expect.not.stringContaining('Task To Delete')
    );
  });

  test('displays appropriate visual styling for focus level', async () => {
    const user = userEvent.setup();
    renderWithTaskProvider(<TaskManager />);

    await user.type(screen.getByLabelText(/task name/i), 'High Focus Task');
    await user.type(screen.getByLabelText(/time spent/i), '1');
    await user.selectOptions(screen.getByLabelText(/focus level/i), 'high');
    await user.type(screen.getByLabelText(/date/i), '2024-03-16');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await user.type(screen.getByLabelText(/task name/i), 'Low Focus Task'); // Form should reset or allow new entry
    await user.type(screen.getByLabelText(/time spent/i), '2');
    await user.selectOptions(screen.getByLabelText(/focus level/i), 'low');
    await user.type(screen.getByLabelText(/date/i), '2024-03-17');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      const highFocusTaskItem = screen.getByText(/high focus task/i).closest('li');
      expect(highFocusTaskItem).toHaveAttribute('data-focus-level', 'high');
      // You could also check for a specific class if that's how styling is applied
      // expect(highFocusTaskItem).toHaveClass('task-focus-high');

      const lowFocusTaskItem = screen.getByText(/low focus task/i).closest('li');
      expect(lowFocusTaskItem).toHaveAttribute('data-focus-level', 'low');
      // expect(lowFocusTaskItem).toHaveClass('task-focus-low');
    });
  });

});

// Note: These tests assume a TaskContext (`<TaskProvider>`) is used to manage task state
// and interact with localStorage. If TaskManager does this directly, the provider wrap is not needed.
// The `aria-label` for form, edit/delete buttons, and display formats of task details
// are assumptions and should match the actual implementation.
// For "edit" and "delete", the buttons need to be uniquely identifiable, often by being
// associated with the task text or an ID. Using `aria-label` like "Edit Original Task" is one way.
// The form fields (getByLabelText) and submit button (getByRole 'button', name 'Add Task' / 'Update Task')
// also rely on correct labeling and naming in the component.
// The `data-focus-level` attribute is an assumption for how focus level might be styled or identified.
// It could also be a class name (e.g., `focus-high`).
// The tests for edit/delete assume that after clicking the respective buttons, the form
// is either pre-filled (for edit) or the task is removed from the list (for delete).
// The exact mechanism for initiating an edit (e.g., which button to click) needs to match the UI.
// Typically, each task in the list would have its own edit and delete buttons.
// Example task list item structure:
// <li data-focus-level="medium">
//   <span>Task Name (X hours, Focus: Medium, Date)</span>
//   <button aria-label="Edit Task Name">Edit</button>
//   <button aria-label="Delete Task Name">Delete</button>
// </li>
// This structure would work with the tests.
// The form name `aria-label="task input form"` on the `<form>` tag is also assumed.
// The heading `aria-label="Task list"` on an `<h2>` or similar for the list section.
// Clearing form after submission: The tests implicitly assume the form is ready for new input after submission.
// If not, `clear()` calls would be needed for form fields before adding the second task in some tests.
// e.g. await user.clear(screen.getByLabelText(/task name/i));
// This is handled by typing into the same field for "High Focus Task" and "Low Focus Task"
// assuming it's either cleared or a new TaskManager instance is used per test (which it is).
// The `waitFor` calls are important for asynchronous updates to the DOM after user actions.
// The `localStorage` calls are mocked at the top. We check `setItem` to ensure persistence.
// `getItem` is used to test loading initial state.
// If the TaskManager or TaskContext performs API calls to sync tasks with a backend,
// those `fetch` calls would also need to be mocked, and tests could verify them.
// The current prompt focuses on localStorage, so fetch mocking is minimal.
// The submit button text might change from "Add Task" to "Update Task" when editing.
// The tests account for this by looking for "Update Task" in the edit test.
// The `id` field in task objects is important for editing/deleting the correct task.
// TaskContext would typically generate these IDs (e.g., using `uuid`).
// The tests assume tasks are rendered as `<li>` elements. This can be adjusted.
// The display of "X hours" and "Focus: medium" is an assumption of how task details are rendered.
// These should match the actual text content or structure.
// For example, if time is just `<span>{timeSpent}</span>`, then check `screen.getByText('1.5')`.
// The tests use more descriptive text like `/1.5 hours/i` for robustness.
