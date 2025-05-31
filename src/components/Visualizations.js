import React, { useMemo } from 'react';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Calendar, TrendingUp, Clock, Focus } from 'lucide-react';
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
 * Stats grid for overview metrics
 */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
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
 * Stat value
 */
const StatValue = styled.div`
  font-size: 28px;
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
  font-size: 14px;
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
 * Heatmap cell
 */
const HeatmapCell = styled.div`
  aspect-ratio: 1;
  border-radius: ${props => props.theme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => {
    const intensity = props.intensity || 0;
    const baseColor = props.theme.colors.primary;
    const alpha = Math.max(0.1, intensity / 10); // Normalize intensity to 0-1
    
    return `
      background: ${baseColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')};
      color: ${intensity > 5 ? props.theme.colors.primaryText : props.theme.colors.text.primary};
    `;
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
`;

/**
 * Heatmap legend
 */
const HeatmapLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
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
 * Visualizations component showing productivity analytics
 */
function Visualizations({ tasks }) {
  /**
   * Calculate productivity statistics
   */
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const avgFocus = tasks.length > 0 
      ? tasks.reduce((sum, task) => {
          const focusValues = { low: 1, medium: 2, high: 3 };
          return sum + focusValues[task.focusLevel];
        }, 0) / tasks.length
      : 0;
    
    const focusLabel = avgFocus < 1.5 ? 'Low' : avgFocus < 2.5 ? 'Medium' : 'High';
    
    return {
      totalTasks,
      totalHours: totalHours.toFixed(1),
      avgFocus: focusLabel,
      productivity: totalTasks > 0 ? (totalHours / totalTasks).toFixed(1) : '0'
    };
  }, [tasks]);

  /**
   * Prepare daily productivity data for charts
   */
  const dailyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => task.date === dateStr);
      
      return {
        date: format(date, 'MMM dd'),
        tasks: dayTasks.length,
        hours: dayTasks.reduce((sum, task) => sum + task.timeSpent, 0),
        focus: dayTasks.length > 0 
          ? dayTasks.reduce((sum, task) => {
              const focusValues = { low: 1, medium: 2, high: 3 };
              return sum + focusValues[task.focusLevel];
            }, 0) / dayTasks.length
          : 0
      };
    });
    
    return last7Days;
  }, [tasks]);

  /**
   * Prepare focus level distribution data
   */
  const focusData = useMemo(() => {
    const focusCount = { low: 0, medium: 0, high: 0 };
    tasks.forEach(task => {
      focusCount[task.focusLevel]++;
    });
    
    const colors = {
      low: '#fbbf24',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    
    return Object.entries(focusCount).map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count,
      color: colors[level]
    }));
  }, [tasks]);

  /**
   * Prepare heatmap data for the last 4 weeks
   */
  const heatmapData = useMemo(() => {
    const weeks = 4;
    const startDate = subDays(new Date(), weeks * 7 - 1);
    const endDate = new Date();
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => task.date === dateStr);
      const totalHours = dayTasks.reduce((sum, task) => sum + task.timeSpent, 0);
      
      return {
        date: dateStr,
        day: format(date, 'dd'),
        intensity: totalHours,
        tasks: dayTasks.length
      };
    });
  }, [tasks]);

  return (
    <VisualizationContainer>
      {/* Overview Stats */}
      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalTasks}</StatValue>
          <StatLabel>Total Tasks</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalHours}h</StatValue>
          <StatLabel>Total Hours</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.avgFocus}</StatValue>
          <StatLabel>Avg Focus</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.productivity}h</StatValue>
          <StatLabel>Hours/Task</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Daily Productivity Trend */}
      <ChartSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader>
          <SectionTitle>
            <TrendingUp />
            Daily Productivity Trend
          </SectionTitle>
          <SectionDescription>
            Track your daily task completion and time spent over the last week
          </SectionDescription>
        </SectionHeader>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="tasks" 
                fill={`var(--theme-primary, #6366f1)`}
                radius={[4, 4, 0, 0]}
                name="Tasks"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartSection>

      {/* Time Spent Chart */}
      <ChartSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SectionHeader>
          <SectionTitle>
            <Clock />
            Time Spent Analysis
          </SectionTitle>
          <SectionDescription>
            Visualize your time investment patterns throughout the week
          </SectionDescription>
        </SectionHeader>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke={`var(--theme-secondary, #f59e0b)`}
                strokeWidth={3}
                dot={{ fill: `var(--theme-secondary, #f59e0b)`, strokeWidth: 2, r: 4 }}
                name="Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
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

      {/* Productivity Heatmap */}
      <ChartSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <SectionHeader>
          <SectionTitle>
            <Calendar />
            Productivity Heatmap
          </SectionTitle>
          <SectionDescription>
            Visual overview of your productivity intensity over the last 4 weeks
          </SectionDescription>
        </SectionHeader>
        <HeatmapContainer>
          {heatmapData.map((day, index) => (
            <HeatmapCell
              key={day.date}
              intensity={day.intensity}
              title={`${day.date}: ${day.tasks} tasks, ${day.intensity.toFixed(1)}h`}
            >
              {day.day}
            </HeatmapCell>
          ))}
        </HeatmapContainer>
        <HeatmapLegend>
          <span>Less</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 3, 5, 7, 9].map(intensity => (
              <div
                key={intensity}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: `var(--theme-primary, #6366f1)${Math.round((intensity / 10) * 255).toString(16).padStart(2, '0')}`
                }}
              />
            ))}
          </div>
          <span>More</span>
        </HeatmapLegend>
      </ChartSection>
    </VisualizationContainer>
  );
}

export default Visualizations; 