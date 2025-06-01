import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Focus, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

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
 * Add task section styled component
 */
const AddTaskSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 24px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.medium};
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
 * Segment of unified pill Focus Level component
 */
const FocusChip = styled.button`
  padding: 8px 16px;
  border: none;
  border-right: 1px solid ${props => props.theme.colors.border};
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  flex: 1;
  position: relative;
  
  &:last-child {
    border-right: none;
  }
  
  ${props => props.theme.name === 'tron' && `
    border-right-color: ${props.theme.colors.primary};
  `}
  
  ${props => {
    const focusColors = {
      low: props.theme.colors.focus?.low || props.theme.colors.status.info,
      medium: props.theme.colors.focus?.medium || props.theme.colors.secondary,
      high: props.theme.colors.focus?.high || props.theme.colors.status.error
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
    `}
    
    ${props => props.theme.name === 'tron' && !props.selected && `
      color: ${props.theme.colors.primary};
    `}
  }
  
  &:focus {
    outline: none;
    ${props => !props.selected && `
      background: ${props.theme.colors.backgroundHover};
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
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
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
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 20px;
  box-shadow: ${props => props.theme.shadows.small};
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
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
  onTaskInputChange = () => {}
}) {
  const [formData, setFormData] = useState({
    name: '',
    timeSpent: '',
    focusLevel: 'medium'
  });

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name') {
        onTaskInputChange(updated.name);
      }
      return updated;
    });
  };

  /**
   * Handle focus level selection
   */
  const handleFocusLevelChange = (level) => {
    setFormData(prev => ({ ...prev, focusLevel: level }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.timeSpent) return;

    onAddTask({
      name: formData.name.trim(),
      timeSpent: parseFloat(formData.timeSpent),
      focusLevel: formData.focusLevel
    });

    setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
  };

  /**
   * Get today's tasks
   */
  const todaysTasks = tasks.filter(task => 
    task.date === new Date().toISOString().split('T')[0]
  );

  return (
    <TaskContainer>
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
                required
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
              />
            </InputGroup>

            <InputGroup>
              <Label>Focus Level</Label>
              <FocusSelector>
                {['low', 'medium', 'high'].map(level => (
                  <FocusChip
                    key={level}
                    type="button"
                    level={level}
                    selected={formData.focusLevel === level}
                    onClick={() => handleFocusLevelChange(level)}
                  >
                    {level}
                  </FocusChip>
                ))}
              </FocusSelector>
            </InputGroup>
          </FormFields>

          <PrimaryButton type="submit">
            <Plus />
            Log Task
          </PrimaryButton>
        </TaskForm>
      </AddTaskSection>

      <TaskList>
        <AnimatePresence>
          {todaysTasks.length === 0 ? (
            <EmptyState>
              <h3>No tasks yet today</h3>
              <p>Add your first task to start tracking your productivity!</p>
            </EmptyState>
          ) : (
            todaysTasks.map(task => (
              <TaskCard
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                data-testid="task-card"
                data-focus-level={task.focusLevel}
                data-completed={task.completed}
              >
                <TaskHeader>
                  <TaskTitle>{task.name}</TaskTitle>
                  <TaskActions>
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
                    <Focus />
                    {task.focusLevel} focus
                  </MetaItem>
                  <MetaItem>
                    <Check />
                    {format(new Date(task.timestamp), 'h:mm a')}
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