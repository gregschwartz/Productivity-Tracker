import React, { useState, useEffect } from 'react';
import WeeklySummaries from './WeeklySummaries';
import { TimeRangeButton } from '../components/buttons';
import { ChartSection } from '../components/chart';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { SectionSummary } from '../components/sections';
import { SkeletonStatCard, SkeletonChart } from '../components/loading';
import { useTimeRange } from '../hooks/visualizations/useTimeRange';
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
import { getApiUrl } from '../utils/api';
import { format } from 'date-fns';

/**
 * Visualizations tab showing productivity analytics
 */
function Visualizations({ onNavigateToDate, onAddSummary }) {
  const [tasks, setTasks] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_tasks: 0,
    total_hours: 0,
    average_hours_per_task: 0,
    focus_hours: {}
  });

  // Use time range hook with tasks
  const {
    timeRange,
    setTimeRange,
    getDateRange,
    filteredTasks,
    dailyData,
    heatmapData,
    getTimeRangeLabel
  } = useTimeRange(tasks);

  /**
   * Load tasks from the backend API for selected time range
   */
  const loadTasks = async (startDate, endDate) => {
    try {
      const apiUrl = getApiUrl();
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      const url = `${apiUrl}/tasks/?start_date=${startDateStr}&end_date=${endDateStr}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Failed to load tasks from server.');
    }
  };

  /**
   * Load summaries from the backend API
   */
  const loadSummaries = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/summaries/`);
      if (!response.ok) {
        throw new Error(`Failed to load summaries: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSummaries(data);
    } catch (error) {
      setError('Failed to load summaries from server.');
    }
  };

  /**
   * Update statistics when filtered tasks change
   */
  const updateStats = async (filteredTasksData) => {
    if (filteredTasksData.length === 0) {
      setStats({ total_tasks: 0, total_hours: 0, average_hours_per_task: 0, focus_hours: {} });
      return;
    }

    try {
      const { calculateTaskStatistics } = await import('../utils/api');
      const backendStats = await calculateTaskStatistics(filteredTasksData);
      setStats(backendStats);
    } catch (error) {
      // Simple fallback
      const totalTasks = filteredTasksData.length;
      const totalHours = filteredTasksData.reduce((sum, task) => sum + task.time_spent, 0);
      setStats({
        total_tasks: totalTasks,
        total_hours: totalHours,
        average_hours_per_task: totalTasks > 0 ? totalHours / totalTasks : 0,
        focus_hours: {}
      });
    }
  };

  /**
   * Load data when component mounts or time range changes
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { startDate, endDate } = getDateRange;
        await Promise.all([
          loadTasks(startDate, endDate),
          loadSummaries()
        ]);
      } catch (error) {
        // Error handling is done in individual functions
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange]);

  // Update stats when filtered tasks change
  useEffect(() => {
    updateStats(filteredTasks);
  }, [filteredTasks]);

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
                disabled
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
          <SkeletonChart height="200px" />
          <SkeletonChart height="300px" />
          <SkeletonChart height="300px" />
          <SkeletonChart height="150px" />
        </>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200 text-sm">
                ⚠️ {error}
              </div>
            </div>
          )}
          
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
          <StatsCards stats={stats} isLoading={isLoading} />

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