import React from 'react';
import { AnimatePresence } from 'framer-motion';
import EmptyState from '../EmptyState';
import { TaskManagerLoading } from '../loading';
import TaskItem from './TaskItem';
import { TaskList as StyledTaskList } from './TaskManager.styles';
import { ActionButton } from '../buttons';

/**
 * TaskList component for displaying the list of tasks with pagination
 */
function TaskList({
  tasks,
  isLoading,
  selectedDate,
  editingTask,
  onEditTask,
  onDeleteTask,
  theme,
  pagination,
  onLoadMore
}) {
  return (
    <div>
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
      
      {/* Pagination Controls */}
      {pagination && pagination.hasMore && tasks.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 p-6 bg-surface rounded-lg border border-border">
          <ActionButton
            onClick={onLoadMore}
            disabled={isLoading}
            variant="secondary"
            className="min-w-[200px]"
          >
            {isLoading ? 'Loading...' : `Load More (${pagination.total - tasks.length} remaining)`}
          </ActionButton>
          <div className="text-sm text-muted-foreground">
            Showing {tasks.length} of {pagination.total} tasks
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskList;