import React from 'react';
import { useTheme } from 'styled-components';
import { Calendar } from 'lucide-react';
import { ChartSection } from '../chart';
import { HeatmapCell, HeatmapContainer, HeatmapLegend } from '../heatmap';
import { SectionDescription, SectionHeader, SectionTitle } from '../sections';
import { generateLegendData, LegendItem, LegendColorBox } from '../heatmap/HeatmapLegend';

/**
 * ProductivityHeatmap component for displaying daily productivity intensity
 */
function ProductivityHeatmap({ heatmapData, getTimeRangeLabel, onNavigateToDate }) {
  const theme = useTheme();

  return (
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
  );
}

export default ProductivityHeatmap;