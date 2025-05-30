/**
 * Analytics utilities for productivity data processing
 */

/**
 * Calculate productivity insights based on task data
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Insights object with metrics
 */
export function getProductivityInsights(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      completionRate: 0,
      totalHours: 0,
      averageHours: 0,
      mostCommonFocus: 'medium',
      mostCommonCategory: 'Development',
      focusDistribution: { low: 0, medium: 0, high: 0 },
      categoryDistribution: {}
    };
  }

  const completedTasks = tasks.filter(task => task.completed);
  const totalHours = tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  
  const focusLevels = tasks.reduce((acc, task) => {
    acc[task.focusLevel] = (acc[task.focusLevel] || 0) + 1;
    return acc;
  }, {});
  
  const categories = tasks.reduce((acc, task) => {
    const category = task.category || 'Development';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  return {
    completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
    totalHours,
    averageHours: tasks.length > 0 ? totalHours / tasks.length : 0,
    mostCommonFocus: Object.keys(focusLevels).reduce((a, b) => 
      focusLevels[a] > focusLevels[b] ? a : b, 'medium'
    ),
    mostCommonCategory: Object.keys(categories).reduce((a, b) => 
      categories[a] > categories[b] ? a : b, 'Development'
    ),
    focusDistribution: focusLevels,
    categoryDistribution: categories
  };
}

/**
 * Get weekly summary data
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Weekly summary
 */
export function getWeeklySummary(tasks) {
  const insights = getProductivityInsights(tasks);
  const completedTasks = tasks.filter(task => task.completed);
  
  return {
    weekRange: 'This Week',
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    totalHours: insights.totalHours,
    completionRate: insights.completionRate,
    topCategory: insights.mostCommonCategory,
    dominantFocus: insights.mostCommonFocus,
    summary: `You completed ${completedTasks.length} out of ${tasks.length} tasks this week, ` +
             `spending ${insights.totalHours} hours on productivity. Your focus was primarily ` +
             `${insights.mostCommonFocus} level, with most time spent on ${insights.mostCommonCategory} tasks.`,
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
    const date = task.date || new Date().toISOString().split('T')[0];
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
    hours: dayTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0),
    completed: dayTasks.filter(task => task.completed).length,
    avgFocus: dayTasks.length > 0 
      ? dayTasks.reduce((sum, task) => {
          const focusValues = { low: 1, medium: 2, high: 3 };
          return sum + (focusValues[task.focusLevel] || 1);
        }, 0) / dayTasks.length
      : 0
  }));

  return {
    dailyData: dailyData.sort((a, b) => new Date(a.date) - new Date(b.date)),
    totalTasks: tasks.length,
    totalHours: tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0),
    completionRate: tasks.length > 0 ? (tasks.filter(task => task.completed).length / tasks.length) * 100 : 0
  };
} 