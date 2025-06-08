import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Trash2, Check, ChevronLeft, ChevronRight, Edit2, X, Calendar } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
 * Navigation button styled component
 */
const NavButton = styled.button.attrs(props => ({
  className: `
    flex items-center justify-center gap-1.5 px-4 py-2.5 bg-transparent
    border border-border rounded-lg text-text-secondary text-sm font-medium
    transition-all duration-200 cursor-pointer hover:bg-background-hover 
    hover:border-primary hover:text-primary hover:-translate-y-0.5
    ${props.$theme === 'Tron' ? 'border-primary text-text-primary font-mono uppercase tracking-wide hover:glow-sm' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }
`;

/**
 * Today button styled component
 */
const TodayButton = styled(NavButton).attrs(props => ({
  className: `
    ${props.$isToday ? 'bg-primary text-primary-text border-primary' : 'bg-transparent text-text-secondary'}
    border-primary hover:bg-primary hover:text-primary-text
    ${props.$theme === 'Tron' && props.$isToday ? 'glow-sm' : ''}
  `
}))``;

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
 * Input group styled component
 */
const InputGroup = styled.div.attrs({
  className: 'flex flex-col gap-2'
})``;

/**
 * Label styled component
 */
const Label = styled.label.attrs(props => ({
  className: `
    text-sm font-medium text-text-secondary
    ${props.$theme === 'Tron' ? 'text-primary uppercase tracking-wide text-xs' : ''}
  `
}))``;

/**
 * Input styled component
 */
const Input = styled.input.attrs(props => ({
  className: `
    px-4 py-3 border border-border rounded-lg bg-background text-text-primary 
    text-sm transition-all duration-200 focus:border-primary focus:outline-none
    focus:shadow-[0_0_0_3px_rgb(var(--color-primary)/0.2)] placeholder:text-text-muted
    ${props.$theme === 'Tron' ? 'bg-surface border-border text-text-primary font-mono focus:glow-sm' : ''}
  `
}))``;

const FocusSelector = styled.div.attrs(props => ({
  className: `
    flex border border-border rounded-full overflow-hidden bg-background
    ${props.$theme === 'Tron' ? 'border-primary' : ''}
  `
}))``;

/**
 * Segment of unified pill for Focus Level component
 */
const FocusChip = styled.button.attrs(props => ({
  className: `
    px-4 py-3 border-none text-sm font-medium capitalize tracking-wide 
    transition-all duration-200 flex-1 relative h-11 flex items-center justify-center
    border-r border-border last:border-r-0
    ${props.selected 
      ? 'text-white' 
      : 'text-text-primary hover:bg-background-hover hover:text-text-primary hover:-translate-y-0.5'
    }
    ${props.$theme === 'Tron' ? 'border-r-primary' : ''}
    ${props.$theme === 'Tron' && !props.selected ? 'hover:text-primary' : ''}
  `
}))`
  ${props => {
    const focusColors = {
      low: `var(--color-primary)60`,
      medium: `var(--color-primary)A0`, 
      high: `var(--color-primary)`
    };
    
    const color = focusColors[props.level];
    
    return props.selected ? `
      background: ${color};
      ${props.$theme === 'Tron' ? 'box-shadow: inset 0 0 5px currentColor;' : ''}
      ${props.$theme === 'Tron' ? 'color: #000000;' : ''}
    ` : '';
  }}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-primary);
    z-index: 1;
    position: relative;
  }
`;

/**
 * Primary button styled component
 */
const PrimaryButton = styled.button.attrs(props => ({
  className: `
    flex items-center gap-2 px-6 py-3 bg-primary text-primary-text rounded-lg 
    font-medium text-sm transition-all duration-200 cursor-pointer
    hover:-translate-y-0.5 hover:shadow-theme-md focus:outline-none 
    focus:shadow-[0_0_0_3px_var(--color-primary)] disabled:opacity-60 
    disabled:cursor-not-allowed disabled:transform-none
    ${props.$theme === 'Tron' ? 'border border-primary glow-sm uppercase tracking-wide font-mono hover:glow-md' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Secondary button for cancel actions
 */
const SecondaryButton = styled.button.attrs(props => ({
  className: `
    flex items-center gap-2 px-6 py-3 bg-transparent text-text-secondary 
    border border-border rounded-lg font-medium text-sm transition-all duration-200 
    cursor-pointer hover:bg-background-hover hover:border-primary hover:text-primary 
    hover:-translate-y-0.5 focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary)]
    ${props.$theme === 'Tron' ? 'border-border text-text-primary uppercase tracking-wide font-mono hover:glow-sm' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Button group for form actions
 */
const ButtonGroup = styled.div.attrs({
  className: 'flex gap-3 md:flex-row flex-col'
})``;

/**
 * Task list styled component
 */
const TaskList = styled.div.attrs({
  className: 'flex flex-col gap-3'
})``;

/**
 * Task card styled component
 */
const TaskCard = styled(motion.div).attrs(props => ({
  className: `
    rounded-lg p-5 shadow-theme-sm transition-all duration-200 border
    hover:-translate-y-0.5 hover:shadow-theme-md
    ${props.$isEditing ? 'border-primary shadow-[0_0_0_2px_rgb(var(--color-primary)/0.2)]' : 'border-border'}
    ${props.$theme === 'Tron' 
      ? `border-border hover:border-primary ${props.$isEditing ? 'glow-md' : ''}` 
      : ''
    }
  `
}))`
  ${props => {
    // Get focus level background colors
    const focusColors = {
      low: 'var(--color-focus-low)',
      medium: 'var(--color-focus-medium)',
      high: 'var(--color-focus-high)'
    };
    
    return `background: ${focusColors[props.$focusLevel] || 'var(--color-surface)'};`;
  }}
`;

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
 * Icon button styled component
 */
const IconButton = styled.button.attrs(props => ({
  className: `
    p-2 border-none rounded bg-transparent text-text-muted transition-all duration-200 
    cursor-pointer hover:bg-background-hover hover:text-text-secondary hover:scale-110
    ${props.$theme === 'Tron' ? 'hover:text-primary hover:text-glow' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Task meta information styled component
 */
const TaskMeta = styled.div.attrs({
  className: 'flex gap-4 items-center flex-wrap'
})``;

/**
 * Meta item styled component
 */
const MetaItem = styled.div.attrs(props => ({
  className: `
    flex items-center gap-1.5 text-sm text-text-secondary
    ${props.$theme === 'Tron' ? 'font-mono text-text-muted' : ''}
  `
}))`
  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Empty state styled component
 */
const EmptyState = styled.div.attrs({
  className: 'text-center py-15 px-5 text-text-muted'
})`
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: var(--color-text-secondary);
  }
  
  p {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;



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
  onClearDateFilter = () => {}
}) {
  // Get current theme name from data attribute
  const [currentTheme, setCurrentTheme] = useState('Ready');
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const themeName = document.documentElement.getAttribute('data-theme');
      if (themeName) setCurrentTheme(themeName);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // Set initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme');
    if (initialTheme) setCurrentTheme(initialTheme);
    
    return () => observer.disconnect();
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    timeSpent: '',
    focusLevel: 'medium'
  });

  const [editingTask, setEditingTask] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
   * Handle keyboard navigation for focus level pills
   */
  const handleFocusLevelKeyDown = (e, currentLevel) => {
    const levels = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = currentIndex > 0 ? currentIndex - 1 : levels.length - 1;
      const newLevel = levels[newIndex];
      handleFocusLevelChange(newLevel);
      // Focus the new button
      setTimeout(() => {
        const newButton = document.querySelector(`button[level="${newLevel}"]`);
        if (newButton) newButton.focus();
      }, 0);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = currentIndex < levels.length - 1 ? currentIndex + 1 : 0;
      const newLevel = levels[newIndex];
      handleFocusLevelChange(newLevel);
      // Focus the new button
      setTimeout(() => {
        const newButton = document.querySelector(`button[level="${newLevel}"]`);
        if (newButton) newButton.focus();
      }, 0);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFocusLevelChange(currentLevel);
    }
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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.timeSpent) return;

    if (editingTask) {
      // Update existing task
      onUpdateTask(editingTask.id, {
        name: formData.name.trim(),
        timeSpent: parseFloat(formData.timeSpent),
        focusLevel: formData.focusLevel
      });
      setEditingTask(null);
    } else {
      // Create new task
      onAddTask({
        name: formData.name.trim(),
        timeSpent: parseFloat(formData.timeSpent),
        focusLevel: formData.focusLevel
      }, currentDateString);
    }

    setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
  };

  /**
   * Get filtered tasks based on selected date or today's tasks
   * Sort by timestamp (newest first)
   */
  const targetDate = selectedDate || currentDateString;
  const filteredTasks = tasks
    .filter(task => task.date === targetDate)
    .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

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
              <FocusSelector $theme={currentTheme}>
                {['low', 'medium', 'high'].map((level, index) => (
                  <FocusChip
                    key={level}
                    type="button"
                    level={level}
                    selected={formData.focusLevel === level}
                    onClick={() => handleFocusLevelChange(level)}
                    onKeyDown={(e) => handleFocusLevelKeyDown(e, level)}
                    tabIndex={formData.focusLevel === level ? 3 : -1}
                    aria-pressed={formData.focusLevel === level}
                    $theme={currentTheme}
                  >
                    {level}
                  </FocusChip>
                ))}
              </FocusSelector>
            </InputGroup>
          </FormFields>

          <ButtonGroup>
            <PrimaryButton type="submit" tabIndex={4} $theme={currentTheme}>
              {editingTask ? <Check /> : <Plus />}
              {editingTask ? 'Update' : 'Add Task'}
            </PrimaryButton>
            {editingTask && (
              <SecondaryButton type="button" onClick={handleCancelEdit} tabIndex={5} $theme={currentTheme}>
                <X />
                Cancel
              </SecondaryButton>
            )}
          </ButtonGroup>
        </TaskForm>
      </AddTaskSection>

      <TaskList>
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <EmptyState>
              <h3>{selectedDate ? 'No tasks for this date' : 'No tasks yet today'}</h3>
              <p>{selectedDate ? 'No tasks were logged for this date.' : 'Add your first task to start tracking your productivity!'}</p>
            </EmptyState>
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                data-testid="task-card"
                data-focus-level={task.focusLevel}
                data-completed={task.completed}
                data-editing={editingTask && editingTask.id === task.id}
                $isEditing={editingTask && editingTask.id === task.id}
                $focusLevel={task.focusLevel}
              >
                <TaskHeader>
                  <TaskTitle>{task.name}</TaskTitle>
                  <TaskActions>
                    <IconButton
                      onClick={() => handleEditTask(task)}
                      title="Edit task"
                    >
                      <Edit2 />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete task"
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