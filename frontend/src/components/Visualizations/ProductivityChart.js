import React, { useState, useMemo } from 'react';
import { useTheme } from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import { TimeRangeButton } from '../buttons';
import { ChartContainer, ChartLegend, ChartSection, ChartViewToggle } from '../chart';
import { SectionDescription, SectionHeader, SectionHeaderWithControls, SectionTitle } from '../sections';
import { generateLegendData, LegendItem, LegendColorBox } from '../heatmap/HeatmapLegend';

/**
 * ProductivityChart component for displaying daily productivity trends
 */
function ProductivityChart({ dailyData, getTimeRangeLabel }) {
  const [taskViewMode, setTaskViewMode] = useState('tasks'); // 'tasks' or 'time'
  const theme = useTheme();

  return (
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
  );
}

export default ProductivityChart;