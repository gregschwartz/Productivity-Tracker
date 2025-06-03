import React, { useState, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Calendar, TrendingUp, Clock, Focus, FileText, Lightbulb, Target, Plus } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

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
 * Chart section container
 */
const ChartSection = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 24px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.medium};
  `}
`;

/**
 * Section header
 */
const SectionHeader = styled.div`
  margin-bottom: 24px;
`;

/**
 * Section title
 */
const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}

  svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * Section description
 */
const SectionDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  line-height: 1.5;
`;

/**
 * All stats wrapper
 */
const AllStatsWrapper = styled.div`
  margin-bottom: 32px;
  
  @media (min-width: 1200px) {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    
    /* On wide screens, flatten the layout */
    > * {
      display: contents;
    }
  }
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
 * Individual stat card
 */
const StatCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 20px;
  text-align: center;
  box-shadow: ${props => props.theme.shadows.small};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
  `}
`;

/**
 * Stat card title (common theme)
 */
const StatCardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 16px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Stats container for two related stats
 */
const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 16px;
`;

/**
 * Individual stat within a card
 */
const IndividualStat = styled.div`
  text-align: center;
`;

/**
 * Stat value
 */
const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 4px;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-shadow: ${props.theme.glow.small};
  `}
`;

/**
 * Stat label
 */
const StatLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Chart container with responsive sizing
 */
const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
  
  .recharts-tooltip-wrapper {
    .recharts-default-tooltip {
      background: ${props => props.theme.colors.surface} !important;
      border: 1px solid ${props => props.theme.colors.border} !important;
      border-radius: ${props => props.theme.borderRadius.medium} !important;
      box-shadow: ${props => props.theme.shadows.medium} !important;
      color: ${props => props.theme.colors.text.primary} !important;
      
      ${props => props.theme.name === 'tron' && `
        background: ${props.theme.colors.surface} !important;
        border: 1px solid ${props.theme.colors.primary} !important;
        box-shadow: ${props.theme.glow.small} !important;
      `}
    }
  }
`;

/**
 * Heatmap container
 */
const HeatmapContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 16px;
`;

/**
 * Hourly heatmap container
 */
const HourlyHeatmapContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin-top: 16px;
  max-width: 600px;
`;

/**
 * Month label for heatmap
 */
const MonthLabel = styled.div`
  font-size: 8px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1;
  margin-bottom: 1px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `}
`;

/**
 * Day number in heatmap cell
 */
const DayNumber = styled.div`
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
`;

/**
 * Heatmap cell
 */
const HeatmapCell = styled.div`
  aspect-ratio: 1;
  border-radius: ${props => props.theme.borderRadius.small};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid ${props => props.theme.colors.border};
  padding: 2px;
  
  ${props => {
    const intensity = props.intensity || 0;
    const baseColor = props.theme.colors.primary;
    
    if (intensity === 0) {
      // No data - pale shade
      return `
        background: ${props.theme.colors.surface};
        border-color: ${props.theme.colors.border};
        color: ${props.theme.colors.text.muted};
      `;
    } else if (intensity <= 2) {
      // Low intensity
      return `
        background: ${baseColor}40;
        color: ${props.theme.colors.text.primary};
      `;
    } else if (intensity <= 6) {
      // Medium intensity
      return `
        background: ${baseColor}80;
        color: ${props.theme.colors.text.primary};
      `;
    } else {
      // High intensity
      return `
        background: ${baseColor};
        color: ${props.theme.colors.primaryText};
      `;
    }
  }}
  
  ${props => props.theme.name === 'tron' && props.intensity > 0 && `
    box-shadow: ${props.theme.glow.small};
    border-color: ${props.theme.colors.primary};
  `}

  &:hover {
    transform: scale(1.1);
    z-index: 1;
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }
  
  ${props => props.clickable && `
    cursor: pointer;
    
    &:active {
      transform: scale(1.05);
    }
  `}
`;

/**
 * Heatmap legend
 */
const HeatmapLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
  flex-wrap: wrap;
`;

/**
 * Legend item
 */
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

/**
 * Legend color box
 */
const LegendColorBox = styled.div`
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.color};
`;

/**
 * Custom tooltip component for charts
 * @param {Object} props - Component props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Chart data payload
 * @param {string} props.label - Chart label
 */
const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  
  // Provide fallback theme values if theme is undefined
  const fallbackTheme = {
    colors: {
      surface: '#ffffff',
      border: '#e2e8f0',
      text: {
        primary: '#1e293b'
      }
    },
    borderRadius: {
      medium: '8px'
    },
    shadows: {
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  };

  const currentTheme = theme || fallbackTheme;

  if (active && payload && payload.length) {
    return (
      <div style={{
        background: currentTheme.colors?.surface || fallbackTheme.colors.surface,
        border: `1px solid ${currentTheme.colors?.border || fallbackTheme.colors.border}`,
        borderRadius: currentTheme.borderRadius?.medium || fallbackTheme.borderRadius.medium,
        padding: '12px',
        boxShadow: currentTheme.shadows?.medium || fallbackTheme.shadows.medium,
        color: currentTheme.colors?.text?.primary || fallbackTheme.colors.text.primary
      }}>
        <p style={{ marginBottom: '8px', fontWeight: '600' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};



/**
 * Generate legend data for heatmap
 * @param {Object} theme - Theme object
 */
const generateLegendData = (theme) => {
  const baseColor = theme?.colors?.primary || '#6366f1';
  const surfaceColor = theme?.colors?.surface || '#ffffff';
  
  return [
    { label: 'No data', color: surfaceColor },
    { label: 'Low', color: `${baseColor}40` },
    { label: 'Medium', color: `${baseColor}80` },
    { label: 'High', color: baseColor }
  ];
};

/**
 * Time range selector container
 */
const TimeRangeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  border: 2px solid ${props => props.theme.colors.primary};
  position: sticky;
  top: 10px;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  ${props => props.theme.name === 'tron' && `
    border: 2px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.medium};
    background: ${props.theme.colors.surface}ee;
  `}
`;

/**
 * Time range button
 */
const TimeRangeButton = styled.button`
  padding: 8px 16px;
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.active ? props.theme.colors.primaryText : props.theme.colors.text.primary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
    ${props.active ? `
      box-shadow: ${props.theme.glow.small};
      border-color: ${props.theme.colors.primary};
    ` : ''}
  `}

  &:hover {
    background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    
    ${props => props.theme.name === 'tron' && !props.active && `
      border-color: ${props.theme.colors.primary};
    `}
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Chart view toggle container
 */
const ChartViewToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

/**
 * Section header with controls
 */
const SectionHeaderWithControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
`;

/**
 * Chart legend container
 */
const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  flex-wrap: wrap;
`;



/**
 * Summary card container
 */
const SummaryCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.medium};
  `}
`;

/**
 * Summary header
 */
const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

/**
 * Summary title
 */
const SummaryTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Summary date
 */
const SummaryDate = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.text.muted};
  font-weight: 500;
`;

/**
 * Summary content section
 */
const SummaryContent = styled.div`
  display: grid;
  gap: 8px;
`;

/**
 * Summary insight
 */
const SummaryInsight = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: ${props => props.theme.colors.backgroundHover};
  border-radius: ${props => props.theme.borderRadius.medium};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.primary};
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

/**
 * No summaries message
 */
const NoSummariesMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme.colors.text.muted};
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

/**
 * Generate summary button
 */
const GenerateSummaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: ${props.theme.glow.small};
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Visualizations component showing productivity analytics and summaries
 */
function Visualizations({ tasks = [], summaries = [], onNavigateToDate }) {
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
        return {
          start: subDays(now, 6),
          end: now,
          days: 7
        };
      case 'month':
        return {
          start: subDays(now, 29),
          end: now,
          days: 30
        };
      case 'quarter':
        return {
          start: subDays(now, 89),
          end: now,
          days: 90
        };
      case 'all':
        // Get the earliest task date or 6 months back, whichever is more recent
        const earliestTask = tasks.length > 0 
          ? new Date(Math.min(...tasks.map(task => new Date(task.date))))
          : subDays(now, 179);
        const startDate = earliestTask < subDays(now, 179) ? subDays(now, 179) : earliestTask;
        return {
          start: startDate,
          end: now,
          days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
        };
      default:
        return {
          start: subDays(now, 6),
          end: now,
          days: 7
        };
    }
  }, [timeRange, tasks]);

  /**
   * Filter tasks based on selected time range
   */
  const filteredTasks = useMemo(() => {
    const { start, end } = getDateRange;
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, getDateRange]);

  /**
   * Calculate productivity statistics
   */
  const stats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const totalHours = filteredTasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const avgFocus = filteredTasks.length > 0 
      ? filteredTasks.reduce((sum, task) => {
          const focusValues = { low: 1, medium: 2, high: 3 };
          return sum + focusValues[task.focusLevel];
        }, 0) / filteredTasks.length
      : 0;
    
    const focusLabel = avgFocus < 1.5 ? 'Low' : avgFocus < 2.5 ? 'Medium' : 'High';
    
    // Calculate focus level breakdowns
    const focusBreakdown = { low: [], medium: [], high: [] };
    filteredTasks.forEach(task => {
      // Handle invalid focus levels by defaulting to 'medium'
      const focusLevel = task.focusLevel && focusBreakdown[task.focusLevel] ? task.focusLevel : 'medium';
      focusBreakdown[focusLevel].push(task);
    });
    
    const focusStats = {
      low: {
        tasks: focusBreakdown.low.length,
        hours: focusBreakdown.low.reduce((sum, task) => sum + task.timeSpent, 0),
        avgHours: focusBreakdown.low.length > 0 
          ? focusBreakdown.low.reduce((sum, task) => sum + task.timeSpent, 0) / focusBreakdown.low.length
          : 0
      },
      medium: {
        tasks: focusBreakdown.medium.length,
        hours: focusBreakdown.medium.reduce((sum, task) => sum + task.timeSpent, 0),
        avgHours: focusBreakdown.medium.length > 0 
          ? focusBreakdown.medium.reduce((sum, task) => sum + task.timeSpent, 0) / focusBreakdown.medium.length
          : 0
      },
      high: {
        tasks: focusBreakdown.high.length,
        hours: focusBreakdown.high.reduce((sum, task) => sum + task.timeSpent, 0),
        avgHours: focusBreakdown.high.length > 0 
          ? focusBreakdown.high.reduce((sum, task) => sum + task.timeSpent, 0) / focusBreakdown.high.length
          : 0
      }
    };
    
    return {
      totalTasks,
      totalHours: totalHours.toFixed(1),
      avgFocus: focusLabel,
      productivity: totalTasks > 0 ? (totalHours / totalTasks).toFixed(1) : '0',
      focusStats
    };
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
        // Time spent (for switching view)
        lowTime: focusTime.low,
        mediumTime: focusTime.medium,
        highTime: focusTime.high,
        // Legacy fields for other charts
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
    const { start, end } = getDateRange;
    const days = eachDayOfInterval({ start, end });
    
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
   * Prepare hourly productivity data
   */
  const hourlyData = useMemo(() => {
    // Initialize hours 0-23 with zero values
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      tasks: 0,
      totalHours: 0,
      intensity: 0
    }));

    // Aggregate data by hour across all filtered tasks
    filteredTasks.forEach(task => {
      // For now, we'll simulate hour data based on task creation time
      // In a real app, you'd want to track when tasks were actually worked on
      const taskDate = new Date(task.date);
      
      // Distribute task time across typical work hours (simulate realistic patterns)
      const workHours = [9, 10, 11, 13, 14, 15, 16, 17]; // Typical work hours
      const randomWorkHour = workHours[Math.floor(Math.random() * workHours.length)];
      
      hourlyStats[randomWorkHour].tasks += 1;
      hourlyStats[randomWorkHour].totalHours += task.timeSpent;
    });

    // Calculate intensity (normalize to 0-10 scale)
    const maxHours = Math.max(...hourlyStats.map(h => h.totalHours));
    hourlyStats.forEach(hourStat => {
      hourStat.intensity = maxHours > 0 ? (hourStat.totalHours / maxHours) * 10 : 0;
    });

    return hourlyStats;
  }, [filteredTasks]);

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
   * Filter summaries based on selected time range
   */
  const filteredSummaries = useMemo(() => {
    const { start, end } = getDateRange;
    
    return summaries.filter(summary => {
      const summaryDate = new Date(summary.weekStart || summary.timestamp);
      return summaryDate >= start && summaryDate <= end;
    }).sort((a, b) => {
      const dateA = new Date(a.weekStart || a.timestamp);
      const dateB = new Date(b.weekStart || b.timestamp);
      return dateB - dateA; // Most recent first
    });
  }, [summaries, getDateRange]);

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
      {/* Time Range Selector */}
      <TimeRangeSelector>
        {[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'all', label: 'All Time' }
        ].map(option => (
          <TimeRangeButton
            key={option.value}
            active={timeRange === option.value}
            onClick={() => setTimeRange(option.value)}
          >
            {option.label}
          </TimeRangeButton>
        ))}
      </TimeRangeSelector>

      {/* Overview Stats */}
      <AllStatsWrapper>
        <OverviewStatsRow>
          <StatCard>
            <StatCardTitle>Total</StatCardTitle>
            <StatsContainer>
              <IndividualStat>
                <StatValue>{stats.totalTasks}</StatValue>
                <StatLabel>Tasks</StatLabel>
              </IndividualStat>
              <IndividualStat>
                <StatValue>{stats.totalHours}h</StatValue>
                <StatLabel>Hours</StatLabel>
              </IndividualStat>
            </StatsContainer>
          </StatCard>
          
          <StatCard>
            <StatCardTitle>Average</StatCardTitle>
            <StatsContainer>
              <IndividualStat>
                <StatValue>{stats.avgFocus}</StatValue>
                <StatLabel>Focus</StatLabel>
              </IndividualStat>
              <IndividualStat>
                <StatValue>{stats.productivity}h</StatValue>
                <StatLabel>Hours/Task</StatLabel>
              </IndividualStat>
            </StatsContainer>
          </StatCard>
        </OverviewStatsRow>
        
        <FocusStatsRow>
          <StatCard>
            <StatCardTitle>Low Focus</StatCardTitle>
            <StatsContainer>
              <IndividualStat>
                <StatValue>{stats.focusStats.low.hours.toFixed(1)}h</StatValue>
                <StatLabel>Total Hours</StatLabel>
              </IndividualStat>
              <IndividualStat>
                <StatValue>{stats.focusStats.low.avgHours.toFixed(1)}h</StatValue>
                <StatLabel>Per Task</StatLabel>
              </IndividualStat>
            </StatsContainer>
          </StatCard>
          
          <StatCard>
            <StatCardTitle>Medium Focus</StatCardTitle>
            <StatsContainer>
              <IndividualStat>
                <StatValue>{stats.focusStats.medium.hours.toFixed(1)}h</StatValue>
                <StatLabel>Total Hours</StatLabel>
              </IndividualStat>
              <IndividualStat>
                <StatValue>{stats.focusStats.medium.avgHours.toFixed(1)}h</StatValue>
                <StatLabel>Per Task</StatLabel>
              </IndividualStat>
            </StatsContainer>
          </StatCard>
          
          <StatCard>
            <StatCardTitle>High Focus</StatCardTitle>
            <StatsContainer>
              <IndividualStat>
                <StatValue>{stats.focusStats.high.hours.toFixed(1)}h</StatValue>
                <StatLabel>Total Hours</StatLabel>
              </IndividualStat>
              <IndividualStat>
                <StatValue>{stats.focusStats.high.avgHours.toFixed(1)}h</StatValue>
                <StatLabel>Per Task</StatLabel>
              </IndividualStat>
            </StatsContainer>
          </StatCard>
        </FocusStatsRow>
      </AllStatsWrapper>

      {/* Weekly Summaries Section */}
      <ChartSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SectionHeader>
          <SectionTitle>
            <FileText />
            Weekly Summaries
          </SectionTitle>
          <SectionDescription>
            AI-generated insights and recommendations for {getTimeRangeLabel()}
          </SectionDescription>
        </SectionHeader>
        
        {filteredSummaries.length > 0 ? (
          filteredSummaries.map((summary, index) => (
            <SummaryCard
              key={summary.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
            >
              <SummaryHeader>
                <SummaryTitle>
                  <Calendar />
                  Week of {format(new Date(summary.weekStart || summary.timestamp), 'MMM dd, yyyy')}
                </SummaryTitle>
                <SummaryDate>
                  {format(new Date(summary.timestamp), 'MMM dd, yyyy')}
                </SummaryDate>
              </SummaryHeader>
              
              <SummaryContent>
                {summary.insights && summary.insights.length > 0 && (
                  <>
                    {summary.insights.map((insight, idx) => (
                      <SummaryInsight key={idx}>
                        <Lightbulb />
                        <span>{insight}</span>
                      </SummaryInsight>
                    ))}
                  </>
                )}
                
                {summary.recommendations && summary.recommendations.length > 0 && (
                  <>
                    {summary.recommendations.map((recommendation, idx) => (
                      <SummaryInsight key={idx}>
                        <Target />
                        <span>{recommendation}</span>
                      </SummaryInsight>
                    ))}
                  </>
                )}
                
                {summary.summary && (
                  <SummaryInsight>
                    <FileText />
                    <span>{summary.summary}</span>
                  </SummaryInsight>
                )}
              </SummaryContent>
            </SummaryCard>
          ))
        ) : (
          <NoSummariesMessage>
            <div>
              No summaries available for {getTimeRangeLabel()}.
              {timeRange === 'week' && ' Complete tasks throughout the week to generate insights.'}
            </div>
            <GenerateSummaryButton
              onClick={() => {
                // TODO: Implement summary generation logic
                alert('Summary generation feature coming soon!');
              }}
            >
              <Plus />
              Generate Summary
            </GenerateSummaryButton>
          </NoSummariesMessage>
        )}
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
              active={taskViewMode === 'tasks'}
              onClick={() => setTaskViewMode('tasks')}
            >
              Tasks
            </TimeRangeButton>
            <TimeRangeButton
              active={taskViewMode === 'time'}
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
            >
              {day.isFirstOfMonth && day.monthName && <MonthLabel>{day.monthName}</MonthLabel>}
              <DayNumber>{day.day}</DayNumber>
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

      {/* Hourly Productivity Heatmap */}
      <ChartSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <SectionHeader>
          <SectionTitle>
            <Clock />
            Productivity Per Hour
          </SectionTitle>
          <SectionDescription>
            Identify your most productive hours across {getTimeRangeLabel().toLowerCase()}
          </SectionDescription>
        </SectionHeader>
        <HourlyHeatmapContainer>
          {hourlyData.map((hourStat) => (
            <HeatmapCell
              key={hourStat.hour}
              intensity={hourStat.intensity}
              title={`${formatHour(hourStat.hour)}: ${hourStat.tasks} tasks, ${hourStat.totalHours.toFixed(1)}h`}
            >
              {formatHour(hourStat.hour)}
            </HeatmapCell>
          ))}
        </HourlyHeatmapContainer>
        <HeatmapLegend>
          {generateLegendData(theme).map((item, index) => (
            <LegendItem key={index}>
              <LegendColorBox color={item.color} />
              <span>{item.label}</span>
            </LegendItem>
          ))}
        </HeatmapLegend>
      </ChartSection>

    </VisualizationContainer>
  );
}

export default Visualizations; 