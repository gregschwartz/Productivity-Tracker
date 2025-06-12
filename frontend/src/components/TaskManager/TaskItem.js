import React from 'react';
import { Clock, Trash2, Edit2 } from 'lucide-react';
import { IconButton } from '../buttons';
import TaskCard from '../TaskCard';
import MetaItem from '../MetaItem';
import { TaskHeader, TaskTitle, TaskActions, TaskMeta } from './TaskManager.styles';

/**
 * TaskItem component for displaying individual tasks
 */
function TaskItem({ 
  task, 
  editingTask, 
  onEdit, 
  onDelete, 
  theme 
}) {
  return (
    <TaskCard
      key={task.id}
      layout // Enables smooth reordering if list changes
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{
        opacity: 1,
        scale: editingTask?.id === task.id ? 1.03 : 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20, delay: editingTask?.id === task.id ? 0 : 0.1 }
      }}
      exit={{ opacity: 0, scale: 0.5, x: 300, transition: { duration: 0.3 } }}
      data-testid="task-card"
      data-focus-level={task.focus_level}
      data-completed={task.completed} // Assuming task.completed exists
      $isEditing={editingTask && editingTask.id === task.id}
      $focusLevel={task.focus_level}
      $theme={theme} // Pass theme for potential Tron glow on edit
    >
      <TaskHeader>
        <TaskTitle $theme={theme}>{task.name}</TaskTitle>
        <TaskActions>
          <IconButton
            onClick={() => onEdit(task)}
            title="Edit task"
            $theme={theme}
          >
            <Edit2 />
          </IconButton>
          <IconButton
            onClick={() => onDelete(task.id)}
            title="Delete task"
            $theme={theme}
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
  );
}

export default TaskItem;