import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { Plus, Clock, Trash2, Check, ChevronLeft, ChevronRight, Edit2, X, Calendar } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import FocusSelector from '../components/FocusSelector';
import { ActionButton, IconButton, NavButton, SecondaryButton, TodayButton } from '../components/buttons';
import { ButtonGroup, InputGroup, Label, Input } from '../components/forms';
import EmptyState from '../components/EmptyState';
import TaskCard from '../components/TaskCard';
import MetaItem from '../components/MetaItem';
import { TaskLoadingIndicator } from '../components/loading';
import { getApiUrl } from '../utils/api';

/**
 * Main container for task management
 */
const TaskContainer = styled.div.attrs({
  className: 'grid gap-6 grid-cols-1 max-w-3xl mx-auto'
})``;

/**
 * Date filter banner
 */
const DateNavigation = styled.div.attrs(props => ({
  className: `
    rounded-xl p-5 shadow-theme-lg mb-6 relative
    bg-gradient-to-br from-primary/5 to-primary/20 border-2
    ${props.$theme === 'Tron' ? 'border-primary bg-surface' : 'border-primary/30'}
  `
}))`
  ${props => props.$theme === 'Tron' && `
    box-shadow: var(--shadow-medium);
  `}
`;

/**
 * Date navigation header
 */
const DateNavHeader = styled.div.attrs({
  className: 'flex justify-between items-center mb-4'
})``;

/**
 * Current date display
 */
const CurrentDateDisplay = styled.h2.attrs(props => ({
  className: `
    text-xl font-semibold text-text-primary m-0
    ${props.$theme === 'Tron' ? 'text-primary font-mono uppercase tracking-wide' : ''}
  `
}))``;

/**
 * Date navigation controls
 */
const DateNavControls = styled.div.attrs({
  className: 'flex gap-3 items-center md:flex-row flex-col md:gap-3 gap-2 md:items-center items-stretch'
})``;

/**
 * Date navigation buttons
 */
const DateNavButtons = styled.div.attrs({
  className: 'flex gap-2'
})``;


/**
 * Add task section styled component
 */
const AddTaskSection = styled.div.attrs(props => ({
  className: `
    bg-surface rounded-xl p-7 shadow-theme-lg mb-6 border-2 border-dashed 
    border-border transition-all duration-200 hover:border-primary/60
    ${props.$theme === 'Tron' ? 'border-primary/60 hover:border-primary hover:shadow-theme-md' : ''}
  `
}))``;

/**
 * Task form styled component
 */
const TaskForm = styled.form.attrs({
  className: 'grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto] items-end'
})``;

/**
 * Form fields container
 */
const FormFields = styled.div.attrs({
  className: 'grid gap-4 grid-cols-1 md:grid-cols-[2fr_1fr_1fr]'
})``;

/**
 * Task list styled component
 */
const TaskList = styled.div.attrs({
  className: 'flex flex-col gap-3'
})``;



/**
 * Task header styled component
 */
const TaskHeader = styled.div.attrs({
  className: 'flex justify-between items-start gap-4 mb-3'
})``;

/**
 * Task title styled component
 */
const TaskTitle = styled.h3.attrs(props => ({
  className: `
    text-base font-semibold text-text-primary flex-1 m-0
    ${props.$theme === 'Tron' ? 'text-primary font-mono' : ''}
  `
}))``;

/**
 * Task actions styled component
 */
const TaskActions = styled.div.attrs({
  className: 'flex gap-2'
})``;

/**
 * Task meta information styled component
 */
const TaskMeta = styled.div.attrs({
  className: 'flex gap-4 items-center flex-wrap'
})``;






/**
 * TaskManager component for managing daily productivity tasks
 */
function TaskManager({ 
  selectedDate = null,
  onDateChange = () => {},
  onClearDateFilter = () => {}
}) {
  const theme = useTheme();
  let currentTheme = theme.name || 'Ready';

  // Local state for task management
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging to check tasks loaded from API
  console.debug('TaskManager tasks:', tasks);

  const [formData, setFormData] = useState({
    name: '',
    timeSpent: '',
    focusLevel: 'medium'
  });

  const [editingTask, setEditingTask] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'submitting', 'success'
  const [justUpdatedTaskId, setJustUpdatedTaskId] = useState(null);

  /**
   * Load tasks from the backend API for current date
   */
  const loadTasks = async (dateFilter = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/tasks/`;
      
      // Always apply a date filter - use selectedDate or today
      const targetDate = dateFilter || new Date().toISOString().split('T')[0];
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      url += `?start_date=${targetDate}&end_date=${nextDay.toISOString().split('T')[0]}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks from server.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new task to the backend and local state
   */
  const addTask = async (task, targetDate = null) => {
    let dateToUse;
    if (task.date_worked && task.date_worked.includes('T')) {
      // Already a full datetime string
      dateToUse = task.date_worked;
    } else {
      dateToUse = targetDate || task.date_worked || selectedDate || new Date().toISOString().split('T')[0];
    }
    const newTask = {
      ...task,
      date_worked: dateToUse,
      id: undefined
    };

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
      }

      const createdTask = await response.json();
      setTasks(prev => Array.isArray(prev) ? [...prev, createdTask] : [createdTask]);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to save task to server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Update an existing task in the backend and local state
   */
  const updateTask = async (taskId, updatedTask) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
      }

      const updatedTaskFromServer = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTaskFromServer : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Delete a task from the backend and local state
   */
  const deleteTask = async (taskId) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/tasks/${taskId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task on server. Please try again.');
      throw error; // Re-throw so calling code knows the operation failed
    }
  };

  /**
   * Load tasks when component mounts or date changes
   */
  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate]);


  /**
   * Get the current working date (selected date or today)
   */
  const getCurrentDate = () => {
    if (selectedDate) {
      try {
        return parseISO(selectedDate);
      } catch (error) {
        console.error('Invalid date format:', selectedDate);
        return new Date();
      }
    }
    return new Date();
  };

  const currentDate = getCurrentDate();
  const currentDateString = format(currentDate, 'yyyy-MM-dd');
  const isToday = currentDateString === format(new Date(), 'yyyy-MM-dd');

  /**
   * Navigate to previous day
   */
  const handlePreviousDay = () => {
    const previousDay = subDays(currentDate, 1);
    const dateString = format(previousDay, 'yyyy-MM-dd');
    onDateChange(dateString);
  };

  /**
   * Navigate to next day
   */
  const handleNextDay = () => {
    const nextDay = addDays(currentDate, 1);
    const dateString = format(nextDay, 'yyyy-MM-dd');
    onDateChange(dateString);
  };

  /**
   * Navigate to today
   */
  const handleToday = () => {
    onClearDateFilter();
  };



  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle focus level selection
   */
  const handleFocusLevelChange = (level) => {
    setFormData(prev => ({ ...prev, focusLevel: level }));
  };

  /**
   * Start editing a task
   */
  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      timeSpent: task.time_spent.toString(),
      focusLevel: task.focus_level
    });
  };

  /**
   * Cancel editing and return to create mode
   */
  const handleCancelEdit = () => {
    setEditingTask(null);
    setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.timeSpent || submitStatus === 'submitting') return;

    setSubmitStatus('submitting');
    
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          name: formData.name.trim(),
          time_spent: parseFloat(formData.timeSpent),
          focus_level: formData.focusLevel
        });
        setJustUpdatedTaskId(editingTask.id); // Trigger update animation
        setEditingTask(null);
        setTimeout(() => setJustUpdatedTaskId(null), 1000); // Reset after animation duration
      } else {
        const taskPayload = { 
          name: formData.name.trim(),
          time_spent: parseFloat(formData.timeSpent),
          focus_level: formData.focusLevel,
          date_worked: currentDateString };
        await addTask(taskPayload, currentDateString);
      }
      
      // Only clear form and show success if operation succeeded
      setSubmitStatus('success');
      setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
      setTimeout(() => setSubmitStatus('idle'), 1500); // Revert button state
    } catch (error) {
      console.error('Task operation failed:', error);
      setSubmitStatus('idle'); // Reset button to allow retry
      // Don't clear form data - let user retry with same data
    }
  };

  const sortedTasks = Array.isArray(tasks) ? tasks.sort((a, b) => new Date(b.date_worked) - new Date(a.date_worked)) : [];

  return (
    <TaskContainer>
          <DateNavigation $theme={currentTheme}>
      <DateNavHeader>
        <CurrentDateDisplay $theme={currentTheme}>
          {format(currentDate, 'EEEE, MMMM dd, yyyy')}
        </CurrentDateDisplay>
          <DateNavControls>
                      <DateNavButtons>
            <NavButton onClick={handlePreviousDay} title="Previous day" $theme={currentTheme}>
              <ChevronLeft />
            </NavButton>
            <TodayButton 
              onClick={handleToday} 
              $isToday={isToday}
              $theme={currentTheme}
              title="Go to today"
            >
              Today
            </TodayButton>
            <NavButton onClick={handleNextDay} title="Next day" $theme={currentTheme}>
              <ChevronRight />
            </NavButton>
            </DateNavButtons>
            <div style={{ position: 'relative' }}>
              <NavButton 
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Jump to date"
                $theme={currentTheme}
              >
                <Calendar />
              </NavButton>
              {showDatePicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 10,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <ReactCalendar
                    value={currentDate}
                    onChange={(date) => {
                      const dateString = format(date, 'yyyy-MM-dd');
                      if (dateString === format(new Date(), 'yyyy-MM-dd')) {
                        onClearDateFilter();
                      } else {
                        onDateChange(dateString);
                      }
                      setShowDatePicker(false);
                    }}
                    calendarType="iso8601"
                  />
                </div>
              )}
            </div>
          </DateNavControls>
        </DateNavHeader>
      </DateNavigation>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}
      
      <AddTaskSection $theme={currentTheme}>
        <TaskForm onSubmit={handleSubmit}>
          <FormFields>
            <InputGroup>
              <Label htmlFor="taskName" $theme={currentTheme}>Describe the Task</Label>
              <Input
                id="taskName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="What did you work on?"
                autoFocus
                required
                tabIndex={1}
                $theme={currentTheme}
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="timeSpent" $theme={currentTheme}>Hours Spent</Label>
              <Input
                id="timeSpent"
                name="timeSpent"
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={formData.timeSpent}
                onChange={handleInputChange}
                placeholder="2.5"
                required
                tabIndex={2}
                $theme={currentTheme}
              />
            </InputGroup>

            <InputGroup>
              <Label $theme={currentTheme}>Focus Level</Label>
              <FocusSelector
                value={formData.focusLevel}
                onChange={handleFocusLevelChange}
                tabIndex={3}
              />
            </InputGroup>
          </FormFields>

          <ButtonGroup>
            <ActionButton
              type="submit"
              tabIndex={4}
              disabled={submitStatus === 'submitting'}
              loading={submitStatus === 'submitting'}
              icon={submitStatus === 'success' ? <Check size={20} /> : (editingTask ? <Check /> : <Plus />)}
            >
              {submitStatus === 'submitting' ? 'Saving...' : (submitStatus === 'success' ? 'Saved!' : (editingTask ? 'Update' : 'Add Task'))}
            </ActionButton>
            {editingTask && (
              <SecondaryButton 
                type="button" 
                onClick={handleCancelEdit} 
                tabIndex={5} 
                disabled={submitStatus === 'submitting'}
                $theme={currentTheme}
              >
                <X />
                Cancel
              </SecondaryButton>
            )}
          </ButtonGroup>
        </TaskForm>
      </AddTaskSection>

      <TaskList>
        {isLoading && sortedTasks.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <TaskLoadingIndicator />
          </div>
        )}
        <AnimatePresence>
          {sortedTasks.length === 0 ? (
            <EmptyState
              title={selectedDate ? 'No tasks for this date' : 'No tasks yet today'}
              description={selectedDate ? 'No tasks were logged for this date.' : 'Add your first task to start tracking your productivity!'}
            />
          ) : (
            sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                layout // Enables smooth reordering if list changes
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: editingTask?.id === task.id ? 1.03 : (justUpdatedTaskId === task.id ? [1, 1.02, 1] : 1),
                  y: 0,
                  transition: { type: 'spring', stiffness: 300, damping: 20, delay: editingTask?.id === task.id ? 0 : 0.1 }
                }}
                exit={{ opacity: 0, scale: 0.5, x: 300, transition: { duration: 0.3 } }}
                data-testid="task-card"
                data-focus-level={task.focus_level}
                data-completed={task.completed} // Assuming task.completed exists
                $isEditing={editingTask && editingTask.id === task.id}
                $focusLevel={task.focus_level}
                $theme={currentTheme} // Pass theme for potential Tron glow on edit
              >
                <TaskHeader>
                  <TaskTitle $theme={currentTheme}>{task.name}</TaskTitle>
                  <TaskActions>
                    <IconButton
                      onClick={() => handleEditTask(task)}
                      title="Edit task"
                      $theme={currentTheme}
                    >
                      <Edit2 />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                      $theme={currentTheme}
                    >
                      <Trash2 />
                    </IconButton>
                  </TaskActions>
                </TaskHeader>

                <TaskMeta>
                  <MetaItem>
                    <Clock />
                    {task.time_spent} {task.time_spent === 1 ? 'hour' : 'hours'}
                  </MetaItem>
                  <MetaItem>
                    {task.focus_level} focus
                  </MetaItem>
                </TaskMeta>
              </TaskCard>
            ))
          )}
        </AnimatePresence>
      </TaskList>
    </TaskContainer>
  );
}

export default TaskManager;