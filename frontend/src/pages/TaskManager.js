import React, { useRef } from 'react';
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
  onClearDateFilter = () => {}
}) {
  const theme = useTheme();
  const currentTheme = theme.name || 'Ready';
  const taskFormRef = useRef();

  // Custom hooks for business logic
  const {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask
  } = useTaskManagement(selectedDate);

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
        ref={taskFormRef}
        addTask={addTask}
        updateTask={updateTask}
        currentDateString={currentDateString}
        theme={currentTheme}
      />

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        selectedDate={selectedDate}
        taskFormRef={taskFormRef}
        onDeleteTask={deleteTask}
        theme={currentTheme}
      />
    </TaskContainer>
  );
}

export default TaskManager;