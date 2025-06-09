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
  tasks = [], 
  onAddTask = () => {}, 
  onUpdateTask = () => {}, 
  onDeleteTask = () => {},
  selectedDate = null,
  onDateChange = () => {},
  onClearDateFilter = () => {},
  isLoading
}) {
  const theme = useTheme();
  let currentTheme = theme.name || 'Ready';

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
      timeSpent: task.timeSpent.toString(),
      focusLevel: task.focusLevel
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
        await onUpdateTask(editingTask.id, {
          name: formData.name.trim(),
          timeSpent: parseFloat(formData.timeSpent),
          focusLevel: formData.focusLevel
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
        await onAddTask(taskPayload, currentDateString);
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

  const filteredTasks = selectedDate
    ? tasks.filter(task => task.date_worked === selectedDate)
    : tasks;

  const sortedTasks = filteredTasks.sort((a, b) => new Date(b.date_worked) - new Date(a.date_worked));

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
                data-focus-level={task.focusLevel}
                data-completed={task.completed} // Assuming task.completed exists
                $isEditing={editingTask && editingTask.id === task.id}
                $focusLevel={task.focusLevel}
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
                      onClick={() => onDeleteTask(task.id)}
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
                    {task.timeSpent} {task.timeSpent === 1 ? 'hour' : 'hours'}
                  </MetaItem>
                  <MetaItem>
                    {task.focusLevel} focus
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