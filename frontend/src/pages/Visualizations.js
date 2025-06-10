import React, { useState, useMemo, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, TrendingUp, Clock, Focus } from 'lucide-react';
import WeeklySummaries from './WeeklySummaries';
import CustomTooltip from '../components/CustomTooltip';
import StatCard from '../components/StatCard';
import { TimeRangeButton } from '../components/buttons';
import { ChartContainer, ChartLegend, ChartSection, ChartViewToggle } from '../components/chart';
import { HeatmapCell, HeatmapContainer, HeatmapLegend } from '../components/heatmap';
import { SectionDescription, SectionHeader, SectionHeaderWithControls, SectionSummary, SectionTitle } from '../components/sections';
import AllStatsWrapper from '../components/AllStatsWrapper';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { generateLegendData, LegendItem, LegendColorBox } from '../components/heatmap/HeatmapLegend';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { SkeletonStatCard, SkeletonChart } from '../components/loading';

/**
 * Container for all visualizations
 */
const VisualizationContainer = styled.div`
  display: grid;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

/**
 * Overview stats row (Total and Average)
 */
const OverviewStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  
  @media (min-width: 1200px) {
    margin-bottom: 0;
  }
`;

/**
 * Focus stats row for focus-level specific metrics
 */
const FocusStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

/**
 * Visualizations tab showing productivity analytics
 */
function Visualizations({ tasks = [], summaries = [], onNavigateToDate, onAddSummary, isLoading }) {
  const [timeRange, setTimeRange] = useState('week'); // week, month, quarter, all
  const [taskViewMode, setTaskViewMode] = useState('tasks'); // 'tasks' or 'time'
  const theme = useTheme();

  /**
   * Get date range based on selected time range
   */
  const getDateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        // Current week (Sunday to Saturday)
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
          days: 7
        };
      case 'month':
        // Show complete weeks for the current month
        const monthStartDate = startOfMonth(now);
        const monthEndDate = endOfMonth(now);
        
        // Start from the beginning of the first week that contains the start of the month
        const monthStartWeek = startOfWeek(monthStartDate);
        
        // Find the last Sunday that falls within the month
        let lastSundayInMonth = monthStartDate;
        let currentSunday = startOfWeek(monthStartDate);
        
        // Iterate through Sundays in the month
        while (currentSunday <= monthEndDate) {
          if (currentSunday >= monthStartDate && currentSunday <= monthEndDate) {
            lastSundayInMonth = currentSunday;
          }
          currentSunday = addDays(currentSunday, 7);
        }
        
        // End at the last day of the week that starts with the last Sunday in the month
        const monthEndWeek = endOfWeek(lastSundayInMonth);
        
        return {
          startDate: monthStartWeek,
          endDate: monthEndWeek,
          days: Math.ceil((monthEndWeek - monthStartWeek) / (1000 * 60 * 60 * 24))
        };
      case 'quarter':
        // Last 12-13 complete weeks (about a quarter)
        const quarterStart = startOfWeek(subWeeks(now, 12));
        return {
          startDate: quarterStart,
          endDate: endOfWeek(now),
          days: Math.ceil((endOfWeek(now) - quarterStart) / (1000 * 60 * 60 * 24))
        };
      case 'all':
        // Get the earliest task date or 6 months back, whichever is more recent
        const earliestTask = tasks.length > 0 
          ? new Date(Math.min(...tasks.map(task => new Date(task.date))))
          : subWeeks(now, 26); // 6 months back
        const allStart = startOfWeek(earliestTask < subWeeks(now, 26) ? subWeeks(now, 26) : earliestTask);
        return {
          startDate: allStart,
          endDate: endOfWeek(now),
          days: Math.ceil((endOfWeek(now) - allStart) / (1000 * 60 * 60 * 24))
        };
      default:
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
          days: 7
        };
    }
  }, [timeRange, tasks]);

  /**
   * Filter tasks based on selected time range
   */
  const filteredTasks = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= startDate && taskDate <= endDate;
    });
  }, [tasks, getDateRange]);

  /**
   * Calculate productivity statistics using backend API
   */
  const [stats, setStats] = useState({
    total_tasks: 0,
    total_hours: 0,
    average_hours_per_task: 0,
    focus_hours: {}
  });

  useEffect(() => {
    const updateStats = async () => {
      if (filteredTasks.length === 0) {
        setStats({ total_tasks: 0, total_hours: 0, average_hours_per_task: 0, focus_hours: {} });
        return;
      }

      try {
        const { calculateTaskStatistics } = await import('../utils/api');
        const backendStats = await calculateTaskStatistics(filteredTasks);
        setStats(backendStats);
      } catch (error) {
        console.error('Failed to get task statistics:', error);
        // Simple fallback
        const totalTasks = filteredTasks.length;
        const totalHours = filteredTasks.reduce((sum, task) => sum + task.timeSpent, 0);
        setStats({
          total_tasks: totalTasks,
          total_hours: totalHours,
          average_hours_per_task: totalTasks > 0 ? totalHours / totalTasks : 0,
          focus_hours: {}
        });
      }
    };

    updateStats();
  }, [filteredTasks]);

  /**
   * Prepare daily productivity data for charts
   */
  const dailyData = useMemo(() => {
    const { days } = getDateRange;
    const displayDays = Math.min(days, timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 14); // Limit display for readability
    
    return Array.from({ length: displayDays }, (_, i) => {
      const date = subDays(new Date(), displayDays - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = filteredTasks.filter(task => task.date === dateStr);
      
      // Count tasks and time by focus level
      const focusCount = { low: 0, medium: 0, high: 0 };
      const focusTime = { low: 0, medium: 0, high: 0 };
      
      dayTasks.forEach(task => {
        focusCount[task.focusLevel]++;
        focusTime[task.focusLevel] += task.timeSpent;
      });
      
      return {
        date: format(date, timeRange === 'week' ? 'MMM dd' : 'MM/dd'),
        // Task counts
        low: focusCount.low,
        medium: focusCount.medium,
        high: focusCount.high,
        // Time spent
        lowTime: focusTime.low,
        mediumTime: focusTime.medium,
        highTime: focusTime.high,
        // Other charts
        tasks: dayTasks.length,
        hours: dayTasks.reduce((sum, task) => sum + task.timeSpent, 0)
      };
    });
  }, [filteredTasks, getDateRange, timeRange]);

  /**
   * Prepare focus level distribution data
   */
  const focusData = useMemo(() => {
    const focusCount = { low: 0, medium: 0, high: 0 };
    filteredTasks.forEach(task => {
      focusCount[task.focusLevel]++;
    });
    
    const baseColor = theme?.colors?.primary || '#6366f1';
    
    return Object.entries(focusCount).map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count,
      color: level === 'low' ? `${baseColor}60` : level === 'medium' ? `${baseColor}A0` : baseColor
    }));
  }, [filteredTasks, theme]);

  /**
   * Prepare heatmap data based on selected time range
   */
  const heatmapData = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map((date, index) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = filteredTasks.filter(task => task.date === dateStr);
      const totalHours = dayTasks.reduce((sum, task) => sum + task.timeSpent, 0);
      
      // Check if this is the first day of the month
      const isFirstOfMonth = date.getDate() === 1;
      const monthName = isFirstOfMonth ? format(date, 'MMM') : null;
      
      return {
        date: dateStr,
        day: format(date, 'dd'),
        monthName,
        isFirstOfMonth,
        intensity: totalHours,
        tasks: dayTasks.length
      };
    });
  }, [filteredTasks, getDateRange]);

  /**
   * Format hour for display
   */
  const formatHour = (hour) => {
    if (hour === 0) return '12AM';
    if (hour === 12) return '12PM';
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
  };

  /**
   * Get time range label for display
   */
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'the last 7 days';
      case 'month': return 'the last 30 days';
      case 'all': return 'all time';
      default: return 'the last 7 days';
    }
  };

  return (
    <VisualizationContainer>
      {isLoading ? (
        <>
          <TimeRangeSelector>
            {[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'all', label: 'All Time' }
            ].map(option => (
              <TimeRangeButton
                key={option.value}
                $active={timeRange === option.value}
                onClick={() => setTimeRange(option.value)}
                // Disabled while loading
              >
                {option.label}
              </TimeRangeButton>
            ))}
          </TimeRangeSelector>
          <AllStatsWrapper>
            <OverviewStatsRow>
              <SkeletonStatCard />
              <SkeletonStatCard />
            </OverviewStatsRow>
            <FocusStatsRow>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </FocusStatsRow>
          </AllStatsWrapper>
          <SkeletonChart height="200px" /> {/* WeeklySummaries skeleton */}
          <SkeletonChart height="300px" /> {/* Daily Productivity skeleton */}
          <SkeletonChart height="300px" /> {/* Focus Distribution skeleton */}
          <SkeletonChart height="150px" /> {/* Daily Heatmap skeleton */}
          <SkeletonChart height="150px" /> {/* Hourly Heatmap skeleton */}
        </>
      ) : (
        <>
          {/* Time Range Selector */}
          <TimeRangeSelector>
        {[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'all', label: 'All Time' }
        ].map(option => (
          <TimeRangeButton
            key={option.value}
            $active={timeRange === option.value}
            onClick={() => setTimeRange(option.value)}
          >
            {option.label}
          </TimeRangeButton>
        ))}
          </TimeRangeSelector>

          {/* Overview Stats */}
          <AllStatsWrapper>
            <OverviewStatsRow>
              <StatCard
                title="Total"
                stats={[
                  { value: stats.total_tasks, label: 'Tasks' },
                  { value: `${stats.total_hours}h`, label: 'Hours' }
                ]}
              />
              
              <StatCard
                title="Average"
                stats={[
                  { value: 'Medium', label: 'Focus Level' },
                  { value: `${(stats.average_hours_per_task || 0).toFixed(1)}h`, label: 'Hours/Task' }
                ]}
              />
            </OverviewStatsRow>
            
            <FocusStatsRow>
              <StatCard
                title="Low Focus"
                stats={[
                  { value: `${(stats.focus_hours?.low || 0).toFixed(1)}h`, label: 'Total Hours' },
                  { value: `${stats.focus_count_percentages?.low?.toFixed(0) || '0'}%`, label: 'Of Tasks' }
                ]}
              />
              
              <StatCard
                title="Medium Focus"
                stats={[
                  { value: `${(stats.focus_hours?.medium || 0).toFixed(1)}h`, label: 'Total Hours' },
                  { value: `${stats.focus_count_percentages?.medium?.toFixed(0) || '0'}%`, label: 'Of Tasks' }
                ]}
              />
              
              <StatCard
                title="High Focus"
                stats={[
                  { value: `${(stats.focus_hours?.high || 0).toFixed(1)}h`, label: 'Total Hours' },
                  { value: `${stats.focus_count_percentages?.high?.toFixed(0) || '0'}%`, label: 'Of Tasks' }
                ]}
              />
            </FocusStatsRow>
          </AllStatsWrapper>

          {/* Weekly Summaries Section */}
          <ChartSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SectionSummary title="Summary" />
            
            <WeeklySummaries 
              tasks={tasks} 
              summaries={summaries} 
              timeRange={getDateRange}
              onAddSummary={onAddSummary}
            />
          </ChartSection>

          {/* Daily Productivity Trend */}
          <ChartSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SectionHeaderWithControls>
              <SectionHeader>
                <SectionTitle>
                  <TrendingUp />
                  How you spent your days
                </SectionTitle>
                <SectionDescription>
                  {taskViewMode === 'tasks' ? 'The number of tasks you completed' : 'The number of hours you spent'} over {getTimeRangeLabel().toLowerCase()}
                </SectionDescription>
              </SectionHeader>
              
              <ChartViewToggle>
                <TimeRangeButton
                  $active={taskViewMode === 'tasks'}
                  onClick={() => setTaskViewMode('tasks')}
                >
                  Tasks
                </TimeRangeButton>
                <TimeRangeButton
                  $active={taskViewMode === 'time'}
                  onClick={() => setTaskViewMode('time')}
                >
                  Time
                </TimeRangeButton>
              </ChartViewToggle>
            </SectionHeaderWithControls>

            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    allowDecimals={taskViewMode === 'tasks' ? false : true}
                    label={{ 
                      value: taskViewMode === 'tasks' ? 'Tasks' : 'Hours', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: '12px' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={taskViewMode === 'tasks' ? 'low' : 'lowTime'}
                    stackId="focus"
                    fill={`${theme?.colors?.primary || '#6366f1'}60`}
                    name="Low Focus"
                  />
                  <Bar 
                    dataKey={taskViewMode === 'tasks' ? 'medium' : 'mediumTime'}
                    stackId="focus"
                    fill={`${theme?.colors?.primary || '#6366f1'}A0`}
                    name="Medium Focus"
                  />
                  <Bar 
                    dataKey={taskViewMode === 'tasks' ? 'high' : 'highTime'}
                    stackId="focus"
                    fill={`${theme?.colors?.primary || '#6366f1'}`}
                    radius={[4, 4, 0, 0]}
                    name="High Focus"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <ChartLegend>
              <LegendItem>
                <LegendColorBox color={`${theme?.colors?.primary || '#6366f1'}60`} />
                <span>Low Focus</span>
              </LegendItem>
              <LegendItem>
                <LegendColorBox color={`${theme?.colors?.primary || '#6366f1'}A0`} />
                <span>Medium Focus</span>
              </LegendItem>
              <LegendItem>
                <LegendColorBox color={`${theme?.colors?.primary || '#6366f1'}`} />
                <span>High Focus</span>
              </LegendItem>
            </ChartLegend>
          </ChartSection>

          {/* Focus Level Distribution */}
          <ChartSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SectionHeader>
              <SectionTitle>
                <Focus />
                Focus Level Distribution
              </SectionTitle>
              <SectionDescription>
                Understand your focus patterns across different tasks
              </SectionDescription>
            </SectionHeader>
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={focusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {focusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={(props) => <CustomTooltip {...props} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartSection>

          {/* Daily Productivity Heatmap */}
          <ChartSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SectionHeader>
              <SectionTitle>
                <Calendar />
                Productivity Per Day
              </SectionTitle>
              <SectionDescription>
                Visual overview of your daily productivity intensity over {getTimeRangeLabel().toLowerCase()}
              </SectionDescription>
            </SectionHeader>
                              <HeatmapContainer>
              {heatmapData.map((day, index) => (
                <HeatmapCell
                  key={day.date}
                  intensity={day.intensity}
                  title={`${day.date}: ${day.tasks} tasks, ${day.intensity.toFixed(1)}h${day.tasks > 0 ? ' - Click to view tasks' : ''}`}
                  clickable={day.tasks > 0 && onNavigateToDate}
                  onClick={() => {
                    if (day.tasks > 0 && onNavigateToDate) {
                      onNavigateToDate(day.date);
                    }
                  }}
                  monthName={day.monthName}
                  isFirstOfMonth={day.isFirstOfMonth}
                >
                  {day.day}
                </HeatmapCell>
              ))}
            </HeatmapContainer>
            <HeatmapLegend>
              {generateLegendData(theme).map((item, index) => (
                <LegendItem key={index}>
                  <LegendColorBox color={item.color} />
                  <span>{item.label}</span>
                </LegendItem>
              ))}
            </HeatmapLegend>
          </ChartSection>
        </>
      )}
    </VisualizationContainer>
  );
}

export default Visualizations; 