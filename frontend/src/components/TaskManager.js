import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Trash2, Check, ChevronLeft, ChevronRight, Edit2, X, Calendar } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

/**
 * Main container for task management
 */
const TaskContainer = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  max-width: 800px;
  margin: 0 auto;
`;

/**
 * Date filter banner
 */
const DateNavigation = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}08, ${props => props.theme.colors.primary}15);
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 20px;
  box-shadow: ${props => props.theme.shadows.large};
  border: 2px solid ${props => props.theme.colors.primary}30;
  margin-bottom: 24px;
  position: relative;
  
  ${props => props.theme.name === 'tron' && `
    border: 2px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.medium};
    background: ${props.theme.colors.surface};
  `}
`;

/**
 * Date navigation header
 */
const DateNavHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

/**
 * Current date display
 */
const CurrentDateDisplay = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Date navigation controls
 */
const DateNavControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
`;

/**
 * Date navigation buttons
 */
const DateNavButtons = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Navigation button styled component
 */
const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  
  ${props => props.theme.name === 'tron' && `
    border-color: ${props.theme.colors.primary};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `}

  &:hover {
    background: ${props => props.theme.colors.backgroundHover};
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;



/**
 * Today button styled component
 */
const TodayButton = styled(NavButton)`
  background: ${props => props.$isToday ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$isToday ? props.theme.colors.primaryText : props.theme.colors.text.secondary};
  border-color: ${props => props.theme.colors.primary};
  
  ${props => props.theme.name === 'tron' && props.$isToday && `
    box-shadow: ${props.theme.glow.small};
  `}
  
  &:hover {
    background: ${props => props.$isToday ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    color: ${props => props.$isToday ? props.theme.colors.primaryText : props.theme.colors.primary};
  }
`;

/**
 * Add task section styled component
 */
const AddTaskSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 28px;
  box-shadow: ${props => props.theme.shadows.large};
  border: 2px dashed ${props => props.theme.colors.border};
  margin-bottom: 24px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary}60;
    box-shadow: ${props => props.theme.shadows.large};
  }
  
  ${props => props.theme.name === 'tron' && `
    border: 2px dashed ${props.theme.colors.primary}60;
    box-shadow: ${props.theme.shadows.medium};
    
    &:hover {
      border-color: ${props.theme.colors.primary};
      box-shadow: ${props.theme.glow.medium};
    }
  `}
`;

/**
 * Task form styled component
 */
const TaskForm = styled.form`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr auto;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Form fields container
 */
const FormFields = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 2fr 1fr 1fr;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Input group styled component
 */
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * Label styled component
 */
const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 12px;
  `}
`;

/**
 * Input styled component
 */
const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.border};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
      border-color: ${props.theme.colors.primary};
    `}
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const FocusSelector = styled.div`
  display: flex;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  overflow: hidden;
  background: ${props => props.theme.colors.background};
  
  ${props => props.theme.name === 'tron' && `
    border-color: ${props.theme.colors.primary};
  `}
`;

/**
 * Segment of unified pill for Focus Level component
 */
const FocusChip = styled.button`
  padding: 12px 16px;
  border: none;
  border-right: 1px solid ${props => props.theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  flex: 1;
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:last-child {
    border-right: none;
  }
  
  ${props => props.theme.name === 'tron' && `
    border-right-color: ${props.theme.colors.primary};
  `}
  
  ${props => {
    const focusColors = {
      low: `${props.theme.colors.primary}60`,    // 60% opacity for low
      medium: `${props.theme.colors.primary}A0`, // ~63% opacity for medium  
      high: props.theme.colors.primary           // Full opacity for high
    };
    
    const color = focusColors[props.level];
    
    return `
      background: ${props.selected ? color : 'transparent'};
      color: ${props.selected 
        ? '#ffffff' 
        : props.theme.colors.text.primary
      };
      
      ${props.theme.name === 'tron' && `
        color: ${props.selected 
          ? '#000000' 
          : props.theme.colors.text.primary
        };
        ${props.selected && `
          box-shadow: inset ${props.theme.glow.small};
        `}
      `}
    `;
  }}

  &:hover {
    ${props => !props.selected && `
      background: ${props.theme.colors.backgroundHover};
      color: ${props.theme.colors.text.primary};
      transform: translateY(-1px);
    `}
    
    ${props => props.theme.name === 'tron' && !props.selected && `
      color: ${props.theme.colors.primary};
    `}
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary};
    z-index: 1;
    position: relative;
    ${props => !props.selected && `
      background: ${props.theme.colors.backgroundHover};
    `}
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: 0 0 0 3px ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Primary button styled component
 */
const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.small};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    background: ${props => props.theme.colors.primary}dd;
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: 0 0 0 3px ${props.theme.colors.primary};
    `}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Secondary button for cancel actions
 */
const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  color: ${props => props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    color: ${props.theme.colors.text.primary};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover {
    background: ${props => props.theme.colors.backgroundHover};
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: 0 0 0 3px ${props.theme.colors.primary};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Button group for form actions
 */
const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * Task list styled component
 */
const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/**
 * Task card styled component
 */
const TaskCard = styled(motion.div)`
  background: ${props => {
    // Get focus level background colors
    const focusColors = {
      low: props.theme.colors.focus.low,
      medium: props.theme.colors.focus.medium,
      high: props.theme.colors.focus.high
    };
    
    return focusColors[props.$focusLevel] || props.theme.colors.surface;
  }};
  border: 1px solid ${props => props.$isEditing ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 20px;
  box-shadow: ${props => props.theme.shadows.small};
  transition: all 0.2s ease;
  
  ${props => props.$isEditing && `
    box-shadow: 0 0 0 2px ${props.theme.colors.primary}20;
  `}
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.$isEditing ? props.theme.colors.primary : props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
    
    ${props.$isEditing && `
      box-shadow: ${props.theme.glow.medium};
    `}
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.shadows.medium};
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Task header styled component
 */
const TaskHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
`;

/**
 * Task title styled component
 */
const TaskTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  flex: 1;
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Task actions styled component
 */
const TaskActions = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Icon button styled component
 */
const IconButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  background: transparent;
  color: ${props => props.theme.colors.text.muted};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.backgroundHover};
    color: ${props => props.theme.colors.text.secondary};
    transform: scale(1.1);
    
    ${props => props.theme.name === 'tron' && `
      color: ${props.theme.colors.primary};
      text-shadow: ${props.theme.glow.small};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Task meta information styled component
 */
const TaskMeta = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

/**
 * Meta item styled component
 */
const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    color: ${props.theme.colors.text.muted};
  `}

  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Empty state styled component
 */
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.text.muted};
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text.secondary};
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
  const targetDate = selectedDate || new Date().toISOString().split('T')[0];
  const filteredTasks = tasks
    .filter(task => task.date === targetDate)
    .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  return (
    <TaskContainer>
      <DateNavigation>
        <DateNavHeader>
          <CurrentDateDisplay>
            {format(currentDate, 'EEEE, MMMM dd, yyyy')}
          </CurrentDateDisplay>
          <DateNavControls>
            <DateNavButtons>
              <NavButton onClick={handlePreviousDay} title="Previous day">
                <ChevronLeft />
              </NavButton>
              <TodayButton 
                onClick={handleToday} 
                $isToday={isToday}
                title="Go to today"
              >
                Today
              </TodayButton>
              <NavButton onClick={handleNextDay} title="Next day">
                <ChevronRight />
              </NavButton>
            </DateNavButtons>
            <div style={{ position: 'relative' }}>
              <NavButton 
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Jump to date"
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
      
      <AddTaskSection>
        <TaskForm onSubmit={handleSubmit}>
          <FormFields>
            <InputGroup>
              <Label htmlFor="taskName">Describe the Task</Label>
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
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="timeSpent">Hours Spent</Label>
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
              />
            </InputGroup>

            <InputGroup>
              <Label>Focus Level</Label>
              <FocusSelector>
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
                  >
                    {level}
                  </FocusChip>
                ))}
              </FocusSelector>
            </InputGroup>
          </FormFields>

          <ButtonGroup>
            <PrimaryButton type="submit" tabIndex={4}>
              {editingTask ? <Check /> : <Plus />}
              {editingTask ? 'Update' : 'Add Task'}
            </PrimaryButton>
            {editingTask && (
              <SecondaryButton type="button" onClick={handleCancelEdit} tabIndex={5}>
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