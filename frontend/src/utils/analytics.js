/**
 * Analytics utilities for productivity data processing
 */
import { calculateTaskStatistics } from './api';

/**
 * Calculate productivity insightsi
 * @param {Array} tasks - Array of task objects
 * @returns {Promise<Object>} Insights object with metrics
 */
export async function getProductivityInsights(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      total_tasks: 0,
      total_hours: 0.0,
      average_hours_per_task: 0.0,
      focus_count_percentages: {},
      focus_hours: {},
      focus_with_most_hours: 'N/A'
    };
  }

  try {
    // Use backend API to calculate statistics
    return await calculateTaskStatistics(tasks);
  } catch (error) {
    console.error('Failed to calculate task statistics:', error);
    // Fallback to basic local calculation
    return {
      total_tasks: tasks.length,
      total_hours: tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0),
      average_hours_per_task: tasks.length > 0 ? tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0) / tasks.length : 0,
      focus_count_percentages: {},
      focus_hours: {},
      focus_with_most_hours: 'N/A'
    };
  }
}

/**
 * Get weekly summary data
 * @param {Array} tasks - Array of task objects
 * @returns {Promise<Object>} Weekly summary
 */
export async function getWeeklySummary(tasks) {
  const insights = await getProductivityInsights(tasks);
  
  return {
    weekRange: 'This Week',
    totalTasks: insights.total_tasks,
    completedTasks: insights.completed_tasks,
    totalHours: insights.total_hours,
    completionRate: insights.completion_rate,
    mostProductiveFocus: insights.most_productive_focus,
    summary: `You completed ${insights.completed_tasks} out of ${insights.total_tasks} tasks this week, ` +
             `spending ${insights.total_hours} hours on productivity. Your most productive focus level was ` +
             `${insights.most_productive_focus}.`,
    suggestions: [
      "Consider time-blocking for deep focus sessions",
      "Take regular breaks to maintain high productivity",
      "Review completed tasks to identify patterns"
    ]
  };
}

/**
 * Process tasks for chart visualization
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Chart data
 */
export function processTasksForCharts(tasks) {
  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const date = task.date_worked || new Date().toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  // Create daily data for charts
  const dailyData = Object.entries(tasksByDate).map(([date, dayTasks]) => ({
    date,
    tasks: dayTasks.length,
    hours: dayTasks.reduce((sum, task) => sum + (task.time_spent || 0), 0),
    completed: dayTasks.filter(task => task.completed).length,
    avgFocus: dayTasks.length > 0 
      ? dayTasks.reduce((sum, task) => {
          const focusValues = { low: 1, medium: 2, high: 3 };
          return sum + (focusValues[task.focus_level] || 1);
        }, 0) / dayTasks.length
      : 0
  }));

  return {
    dailyData: dailyData.sort((a, b) => new Date(a.date) - new Date(b.date)),
    totalTasks: tasks.length,
    totalHours: tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0),
    completionRate: tasks.length > 0 ? (tasks.filter(task => task.completed).length / tasks.length) * 100 : 0
  };
} 