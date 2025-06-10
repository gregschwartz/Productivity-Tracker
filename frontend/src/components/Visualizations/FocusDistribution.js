import React, { useMemo } from 'react';
import { useTheme } from 'styled-components';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Focus } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import { ChartContainer, ChartSection } from '../chart';
import { SectionDescription, SectionHeader, SectionTitle } from '../sections';

/**
 * FocusDistribution component for displaying focus level pie chart
 */
function FocusDistribution({ filteredTasks }) {
  const theme = useTheme();

  /**
   * Prepare focus level distribution data
   */
  const focusData = useMemo(() => {
    const focusCount = { low: 0, medium: 0, high: 0 };
    filteredTasks.forEach(task => {
      focusCount[task.focus_level]++;
    });
    
    const baseColor = theme?.colors?.primary || '#6366f1';
    
    return Object.entries(focusCount).map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count,
      color: level === 'low' ? `${baseColor}60` : level === 'medium' ? `${baseColor}A0` : baseColor
    }));
  }, [filteredTasks, theme]);

  return (
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
  );
}

export default FocusDistribution;