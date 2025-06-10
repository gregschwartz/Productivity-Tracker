import React from 'react';
import StatCard from '../StatCard';
import AllStatsWrapper from '../AllStatsWrapper';
import { OverviewStatsRow, FocusStatsRow } from './Visualizations.styles';

/**
 * StatsCards component for displaying overview and focus-level statistics
 */
function StatsCards({ stats, isLoading }) {
  if (isLoading) {
    return null; // Parent handles loading state
  }

  return (
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
  );
}

export default StatsCards;