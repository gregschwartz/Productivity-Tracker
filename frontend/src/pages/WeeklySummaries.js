import React from 'react';
import styled from 'styled-components';
import { startOfWeek, endOfWeek, getWeek, getYear, addWeeks } from 'date-fns';
import WeekSummary from '../components/WeekSummary';

/**
 * Simple container for weekly summaries without styling to avoid nested boxes
 */
const WeeklySummariesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * Generate an array of week objects within a date range
 * 
 * Note that the weekNumber and year are based on the start date, not end date (e.g. a week starting on Sunday 2025-12-28 is year 2025 week 52, not year 2026 week 1)
 */
const getWeeksInRange = (startDate, endDate) => {
  const weeks = [];
  let currentWeekStart = startOfWeek(startDate);
  
  while (currentWeekStart <= endDate && currentWeekStart <= new Date()) {
    const currentWeekEnd = endOfWeek(currentWeekStart);
    weeks.push({
      startDate: currentWeekStart,
      endDate: currentWeekEnd,
      weekNumber: getWeek(currentWeekStart),
      year: getYear(currentWeekStart)
    });
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }
  
  return weeks;
};

/**
 * WeeklySummaries component - manages summaries for 1+ weeks
 */
function WeeklySummaries({ tasks = [], summaries = [], timeRange, onAddSummary = () => {} }) {
  const { startDate, endDate } = timeRange;
  const weeks = getWeeksInRange(startDate, endDate);

  /**
   * Filter tasks for a specific week
   */
  const getTasksForWeek = (weekStart, weekEnd) => {
    if (!Array.isArray(tasks)) {
      return [];
    }
    return tasks.filter(task => {
      const taskDate = new Date(task.date_worked);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  };

  /**
   * Find summary for a specific week
   */
  const getSummaryForWeek = (weekStart, weekEnd) => {
    const weekStartStr = weekStart.toISOString().split('T')[0];
    return summaries.find(summary => 
      summary.week_start === weekStartStr
    ) || null;
  };


  return (
    <WeeklySummariesContainer>
      {weeks.reverse().map((week, index) => {
        const weekTasks = getTasksForWeek(week.startDate, week.endDate);
        const weekSummary = getSummaryForWeek(week.startDate, week.endDate);
        const weekTimeRange = {
          startDate: week.startDate,
          endDate: week.endDate
        };

        return (
          <WeekSummary
            key={`${week.year}-${week.weekNumber}`}
            summary={weekSummary}
            tasks={weekTasks}
            timeRange={weekTimeRange}
            onAddSummary={onAddSummary}
          />
        );
      })}
    </WeeklySummariesContainer>
  );
}

export default WeeklySummaries; 