import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
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
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  };

  /**
   * Find summary for a specific week
   */
  const getSummaryForWeek = (weekNumber, year) => {
    return summaries.find(summary => 
      summary.week === weekNumber && summary.year === year
    ) || null;
  };

  /**
   * Get surrounding summaries for context (3 before, 3 after)
   */
  const getSurroundingSummaries = (currentWeek, currentYear) => {
    const contextSummaries = {
      before: [],
      after: []
    };
    
    // Find summaries for 3 weeks before
    for (let i = 1; i <= 3; i++) {
      let targetWeek = currentWeek - i;
      let targetYear = currentYear;
      
      // Handle year boundary (week numbers reset each year)
      if (targetWeek <= 0) {
        targetYear--;
        targetWeek = 52 + targetWeek; // Approximate, most years have 52-53 weeks
      }
      
      const beforeSummary = summaries.find(s => s.week === targetWeek && s.year === targetYear);
      if (beforeSummary) {
        contextSummaries.before.unshift(beforeSummary); // Add to beginning so chronological order is maintained
      }
    }
    
    // Find summaries for 3 weeks after  
    for (let i = 1; i <= 3; i++) {
      let targetWeek = currentWeek + i;
      let targetYear = currentYear;
      
      // Handle year boundary
      if (targetWeek > 52) {
        targetYear++;
        targetWeek = targetWeek - 52;
      }
      
      const afterSummary = summaries.find(s => s.week === targetWeek && s.year === targetYear);
      if (afterSummary) {
        contextSummaries.after.push(afterSummary);
      }
    }
    
    return contextSummaries;
  };

  return (
    <WeeklySummariesContainer>
      {weeks.map((week, index) => {
        const weekTasks = getTasksForWeek(week.startDate, week.endDate);
        const weekSummary = getSummaryForWeek(week.weekNumber, week.year);
        const contextSummaries = getSurroundingSummaries(week.weekNumber, week.year);
        const weekTimeRange = {
          startDate: week.startDate,
          endDate: week.endDate
        };

        return (
          <WeekSummary
            key={`${week.year}-${week.weekNumber}`}
            summary={weekSummary}
            contextSummaries={contextSummaries}
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