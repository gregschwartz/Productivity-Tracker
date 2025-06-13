import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import FocusSelector from '../FocusSelector';
import { ActionButton, SecondaryButton } from '../buttons';
import { ButtonGroup, InputGroup, Label, Input } from '../forms';
import { AddTaskSection, TaskForm as StyledTaskForm, FormFields } from './TaskManager.styles';

/**
 * Input validation helpers
 */
const validateHours = (hours) => {
  const num = Number(hours);
  return num >= 0 && num <= 24;
};

const validateTaskName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
};

const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return '';
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * TaskForm component for adding and editing tasks
 */
const TaskForm = ({
  addTask,
  updateTask,
  currentDateString,
  theme,
  editingTask,
  onEditComplete,
  resetTrigger
}) => {
  const [formData, setFormData] = useState({
    name: '',
    timeSpent: '',
    focusLevel: 'medium'
  });

  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'submitting', 'success'
  const [validationErrors, setValidationErrors] = useState({});

  // Handle editing task changes
  useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        timeSpent: editingTask.time_spent.toString(),
        focusLevel: editingTask.focus_level
      });
      setValidationErrors({});
    }
  }, [editingTask]);

  // Handle reset trigger
  useEffect(() => {
    if (resetTrigger) {
      setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
      setValidationErrors({});
      setSubmitStatus('idle');
    }
  }, [resetTrigger]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitize input
    const sanitizedValue = sanitizeInput(value);
    
    // Validate input
    const errors = { ...validationErrors };
    if (name === 'name') {
      if (!validateTaskName(sanitizedValue)) {
        errors.name = 'Task name must be 1-200 characters';
      } else {
        delete errors.name;
      }
    } else if (name === 'timeSpent') {
      if (!sanitizedValue || !validateHours(sanitizedValue)) {
        errors.timeSpent = 'Hours must be between 0 and 24';
      } else {
        delete errors.timeSpent;
      }
    }
    
    setValidationErrors(errors);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  /**
   * Handle focus level selection
   */
  const handleFocusLevelChange = (level) => {
    setFormData(prev => ({ ...prev, focusLevel: level }));
  };

  /**
   * Cancel editing and return to create mode
   */
  const handleCancelEdit = () => {
    if (onEditComplete) {
      onEditComplete(null);
    }
    setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
    setValidationErrors({});
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all inputs before submission
    const errors = {};
    if (!validateTaskName(formData.name)) {
      errors.name = 'Task name must be 1-200 characters';
    }
    if (!formData.timeSpent || !validateHours(formData.timeSpent)) {
      errors.timeSpent = 'Hours must be between 0 and 24';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    if (submitStatus === 'submitting') return;

    setSubmitStatus('submitting');
    
    try {
      // Sanitize data before sending
      const sanitizedName = sanitizeInput(formData.name.trim());
      const sanitizedTimeSpent = parseFloat(formData.timeSpent);
      
      if (editingTask) {
        await updateTask(editingTask.id, {
          name: sanitizedName,
          time_spent: sanitizedTimeSpent,
          focus_level: formData.focusLevel
        });
        if (onEditComplete) {
          onEditComplete(editingTask.id);
        }
      } else {
        const taskPayload = { 
          name: sanitizedName,
          time_spent: sanitizedTimeSpent,
          focus_level: formData.focusLevel,
          date_worked: currentDateString 
        };
        await addTask(taskPayload, currentDateString);
      }
      
      // Only clear form and show success if operation succeeded
      setSubmitStatus('success');
      setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
      setValidationErrors({});
      setTimeout(() => setSubmitStatus('idle'), 1500); // Revert button state
    } catch (error) {
      setSubmitStatus('idle'); // Reset button to allow retry
      // Don't clear form data - let user retry with same data
    }
  };

  return (
    <AddTaskSection $theme={theme}>
      <StyledTaskForm onSubmit={handleSubmit}>
        <FormFields>
          <InputGroup>
            <Label htmlFor="taskName" $theme={theme}>Describe the Task</Label>
            <Input
              id="taskName"
              data-testid="taskName"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="What did you work on?"
              autoFocus
              autoComplete="off"
              required
              tabIndex={1}
              maxLength={200}
              $theme={theme}
              style={{ borderColor: validationErrors.name ? '#dc2626' : undefined }}
            />
            {validationErrors.name && (
              <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {validationErrors.name}
              </div>
            )}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="timeSpent" $theme={theme}>Hours Spent</Label>
            <Input
              id="timeSpent"
              data-testid="timeSpent"
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
              $theme={theme}
              style={{ borderColor: validationErrors.timeSpent ? '#dc2626' : undefined }}
            />
            {validationErrors.timeSpent && (
              <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {validationErrors.timeSpent}
              </div>
            )}
          </InputGroup>

          <InputGroup>
            <Label $theme={theme}>Focus Level</Label>
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
            data-testid="submitButton"
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
              $theme={theme}
            >
              <X />
              Cancel
            </SecondaryButton>
          )}
        </ButtonGroup>
      </StyledTaskForm>
    </AddTaskSection>
  );
};

export default TaskForm;