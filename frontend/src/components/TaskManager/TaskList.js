import React from 'react';
import { AnimatePresence } from 'framer-motion';
import EmptyState from '../EmptyState';
import { TaskManagerLoading } from '../loading';
import TaskItem from './TaskItem';
import { TaskList as StyledTaskList } from './TaskManager.styles';

/**
 * TaskList component for displaying the list of tasks
 */
function TaskList({
  tasks,
  isLoading,
  selectedDate,
  editingTask,
  onEditTask,
  onDeleteTask,
  theme
}) {
  return (
    <StyledTaskList>
      {isLoading && tasks.length === 0 && <TaskManagerLoading />}
      <AnimatePresence>
        {tasks.length === 0 ? (
          <EmptyState
            title={selectedDate ? 'No tasks for this date' : 'No tasks yet today'}
            description={selectedDate ? 'No tasks were logged for this date.' : 'Add your first task to start tracking your productivity!'}
          />
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              editingTask={editingTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              theme={theme}
            />
          ))
        )}
      </AnimatePresence>
    </StyledTaskList>
  );
}

export default TaskList;