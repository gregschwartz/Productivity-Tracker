import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import { useTaskManagement } from '../hooks/taskManager/useTaskManagement';
import { useDateNavigation } from '../hooks/taskManager/useDateNavigation';
import { DateNavigation, TaskForm, TaskList } from '../components/TaskManager';
import { TaskContainer } from '../components/TaskManager/TaskManager.styles';

/**
 * TaskManager component for managing daily productivity tasks
 */
function TaskManager({ 
  selectedDate = null,
  onDateChange = () => {},
  onClearDateFilter = () => {},
  onTasksUpdate = () => {}
}) {
  const theme = useTheme();
  const currentTheme = theme.name || 'Ready';
  const [editingTask, setEditingTask] = useState(null);

  // Custom hooks for business logic
  const {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask
  } = useTaskManagement(selectedDate, onTasksUpdate);

  const {
    currentDate,
    currentDateString,
    isToday,
    showDatePicker,
    setShowDatePicker,
    handlePreviousDay,
    handleNextDay,
    handleToday,
    handleCalendarChange
  } = useDateNavigation(selectedDate, onDateChange, onClearDateFilter);

  const handleEditComplete = (taskId) => {
    setEditingTask(null);
    if (taskId) {
      // Task was updated, could trigger animation here if needed
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  return (
    <TaskContainer>
      <DateNavigation
        currentDate={currentDate}
        isToday={isToday}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handlePreviousDay={handlePreviousDay}
        handleNextDay={handleNextDay}
        handleToday={handleToday}
        handleCalendarChange={handleCalendarChange}
        theme={currentTheme}
      />
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}
      
      <TaskForm
        addTask={addTask}
        updateTask={updateTask}
        currentDateString={currentDateString}
        theme={currentTheme}
        editingTask={editingTask}
        onEditComplete={handleEditComplete}
      />

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        selectedDate={selectedDate}
        editingTask={editingTask}
        onEditTask={handleEditTask}
        onDeleteTask={deleteTask}
        theme={currentTheme}
      />
    </TaskContainer>
  );
}

export default TaskManager;