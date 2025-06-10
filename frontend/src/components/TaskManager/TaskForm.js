import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Plus, Check, X } from 'lucide-react';
import FocusSelector from '../FocusSelector';
import { ActionButton, SecondaryButton } from '../buttons';
import { ButtonGroup, InputGroup, Label, Input } from '../forms';
import { AddTaskSection, TaskForm as StyledTaskForm, FormFields } from './TaskManager.styles';

/**
 * TaskForm component for adding and editing tasks
 */
const TaskForm = forwardRef(({
  addTask,
  updateTask,
  currentDateString,
  theme
}, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    timeSpent: '',
    focusLevel: 'medium'
  });

  const [editingTask, setEditingTask] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'submitting', 'success'
  const [justUpdatedTaskId, setJustUpdatedTaskId] = useState(null);

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
          date_worked: currentDateString 
        };
        await addTask(taskPayload, currentDateString);
      }
      
      // Only clear form and show success if operation succeeded
      setSubmitStatus('success');
      setFormData({ name: '', timeSpent: '', focusLevel: 'medium' });
      setTimeout(() => setSubmitStatus('idle'), 1500); // Revert button state
    } catch (error) {
      setSubmitStatus('idle'); // Reset button to allow retry
      // Don't clear form data - let user retry with same data
    }
  };

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    handleEditTask,
    editingTask,
    justUpdatedTaskId
  }));

  return (
    <AddTaskSection $theme={theme}>
      <StyledTaskForm onSubmit={handleSubmit}>
        <FormFields>
          <InputGroup>
            <Label htmlFor="taskName" $theme={theme}>Describe the Task</Label>
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
              $theme={theme}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="timeSpent" $theme={theme}>Hours Spent</Label>
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
              $theme={theme}
            />
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
});

TaskForm.displayName = 'TaskForm';

export default TaskForm;