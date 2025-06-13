import React, { useState, useEffect } from 'react';
import WeeklySummaries from './WeeklySummaries';
import { TimeRangeButton } from '../components/buttons';
import { ChartSection } from '../components/chart';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { SectionSummary } from '../components/sections';
import { SkeletonStatCard, SkeletonChart } from '../components/loading';
import { useTimeRange } from '../hooks/visualizations/useTimeRange';
import { useVisualizationData } from '../hooks/visualizations/useVisualizationData';
import { 
  StatsCards, 
  ProductivityChart, 
  FocusDistribution, 
  ProductivityHeatmap,
  VisualizationContainer,
  OverviewStatsRow,
  FocusStatsRow
} from '../components/Visualizations';
import AllStatsWrapper from '../components/AllStatsWrapper';

/**
 * Visualizations tab showing productivity analytics
 */
function Visualizations({ onNavigateToDate }) {
  // Initialize tasks state first
  const [initialTasks, setInitialTasks] = useState([]);
  
  // Use time range hook with tasks
  const {
    timeRange,
    setTimeRange,
    getDateRange,
    filteredTasks,
    dailyData,
    heatmapData,
    getTimeRangeLabel
  } = useTimeRange(initialTasks);

  // Use visualization data hook for all data management
  const {
    tasks,
    summaries,
    isLoading,
    error,
    stats,
    updateStats,
    addSummary,
    updateSummary
  } = useVisualizationData(timeRange, getDateRange);

  const timeRangeOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ];

  // Sync tasks from visualization hook to time range hook
  useEffect(() => {
    setInitialTasks(tasks);
  }, [tasks]);

  // Update stats when filtered tasks change
  useEffect(() => {
    updateStats(filteredTasks);
  }, [filteredTasks, updateStats]);

  return (
    <VisualizationContainer>
      {isLoading ? (
        <>
          <TimeRangeSelector>
            {timeRangeOptions.map(option => (
              <TimeRangeButton
                key={option.value}
                $active={timeRange === option.value}
                onClick={() => setTimeRange(option.value)}
                disabled
              >
                {option.label}
              </TimeRangeButton>
            ))}
          </TimeRangeSelector>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200 text-sm">
                ⚠️ {error}
              </div>
            </div>
          )}

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
          <SkeletonChart height="200px" />
          <SkeletonChart height="300px" />
          <SkeletonChart height="300px" />
          <SkeletonChart height="150px" />
        </>
      ) : (
        <>
          {/* Time Range Selector */}
          <TimeRangeSelector>
            {timeRangeOptions.map(option => (
              <TimeRangeButton
              key={option.value}
              $active={timeRange === option.value}
              onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </TimeRangeButton>
            ))}
          </TimeRangeSelector>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200 text-sm">
                ⚠️ {error}
              </div>
            </div>
          )}
          
          {/* Overview Stats */}
          <StatsCards stats={stats} isLoading={isLoading} />

          {/* Weekly Summaries Section */}
          <ChartSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SectionSummary title="Summary" />
            
            <WeeklySummaries 
              tasks={filteredTasks} 
              summaries={summaries} 
              timeRange={getDateRange}
              onAddSummary={addSummary}
              onUpdateSummary={updateSummary}
            />
          </ChartSection>

          {/* Daily Productivity Chart */}
          <ProductivityChart 
            dailyData={dailyData} 
            getTimeRangeLabel={getTimeRangeLabel} 
          />

          {/* Focus Distribution Chart */}
          <FocusDistribution filteredTasks={filteredTasks} />

          {/* Productivity Heatmap */}
          <ProductivityHeatmap 
            heatmapData={heatmapData}
            getTimeRangeLabel={getTimeRangeLabel}
            onNavigateToDate={onNavigateToDate}
          />
        </>
      )}
    </VisualizationContainer>
  );
}

export default Visualizations;