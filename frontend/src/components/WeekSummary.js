import React, { useState } from "react";
import styled from "styled-components";
import { Calendar, Clock, RotateCcw } from "lucide-react";
import { format, getWeek, getYear } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost, apiDelete } from "../utils/api";
import { SearchProgressBar } from "../components/loading";
import GenerateButton from "./WeekSummary/GenerateButton";
import SummaryCard from "./WeekSummary/SummaryCard";
import SummaryContent from "./WeekSummary/SummaryContent";
import SummaryTimestamp from "./WeekSummary/SummaryTimestamp";
import SummaryWeekRange from "./WeekSummary/SummaryWeekRange";
import WeekInfo from "./WeekSummary/WeekInfo";
import ErrorAlert from "./ErrorAlert";
import EmptyState from "./EmptyState";

const focusValues = { low: 1, medium: 2, high: 3 };

/**
 * Container for weekly summary section
 */
const SummaryContainer = styled.div.attrs(() => ({
  className: "flex flex-col gap-6 px-6 md:px-12",
}))``;

/**
 * Summary generation section
 */
const GenerationSection = styled.div.attrs(() => ({
  className: "p-0",
}))``;

/**
 * Week selector styled component
 */
const WeekSelector = styled.div.attrs(() => ({
  className: "flex gap-4 items-center mb-5 flex-wrap justify-start",
}))``;

/**
 * Summary list container
 */
const SummaryList = styled.div.attrs(() => ({
  className: "flex flex-col gap-4",
}))``;

/**
 * Summary header
 */
const SummaryHeader = styled.div.attrs(() => ({
  className: "flex justify-between items-start mb-4",
}))``;

/**
 * Summary meta information
 */
const SummaryMeta = styled.div.attrs(() => ({
  className: "flex items-start justify-between w-full",
}))``;

/**
 * Regenerate button for existing summaries
 */
const RegenerateButton = styled.button.attrs(() => ({
  className: "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all duration-200 mt-3 ml-auto",
}))`
  background-color: ${(props) => props.theme.colors?.secondary || '#f9fafb'};
  border-color: ${(props) => props.theme.colors?.border || '#d1d5db'};
  color: ${(props) => props.theme.colors?.text?.secondary || '#6b7280'};
  
  &:hover {
    ${(props) => props.theme.name === 'dark' ? `
      background-color: ${props.theme.colors?.border || '#374151'};
      border-color: ${props.theme.colors?.text?.secondary || '#9ca3af'};
      color: ${props.theme.colors?.text?.primary || '#f3f4f6'};
    ` : `
      background-color: #fef2f2;
      border-color: #fca5a5;
      color: #dc2626;
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 12px;
    height: 12px;
  }
`;



/**
 * Display AI-generated productivity insights from a single week
 */
function WeekSummary({
  tasks = [],
  summary = null,
  timeRange,
  onAddSummary = () => {},
  onUpdateSummary = () => {},
}) {
  const { startDate, endDate } = timeRange;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Show error if invalid dates are passed
  if (
    !startDate ||
    !endDate ||
    !(startDate instanceof Date) ||
    !(endDate instanceof Date) ||
    isNaN(startDate) ||
    isNaN(endDate)
  ) {
    return (
      <SummaryContainer>
        <ErrorAlert
          title="Invalid Date Range"
          message={
            <div>
              <p>WeekSummary received invalid dates:</p>
              <ul className="list-disc ml-4 mt-2">
                <li>
                  startDate: {String(startDate)} (type: {typeof startDate})
                </li>
                <li>
                  endDate: {String(endDate)} (type: {typeof endDate})
                </li>
              </ul>
            </div>
          }
          type="error"
        />
      </SummaryContainer>
    );
  }

  /**
   * Summarize the week and provide recommendations to improve the next week
   */
  const handleGenerateSummary = async (oldSummaryIfRegenerating = null) => {
    if (tasks.length === 0) return;

    setGenerating(true);
    setError(null);

    try {
      // Prepare task data for AI analysis
      const taskData = tasks.map((task) => ({
        name: task.name,
        time_spent: task.time_spent || task.timeSpent || 0,
        focus_level: task.focus_level || task.focusLevel || 'medium',
        date_worked: task.date_worked || task.date,
      }));

      // Calculate average focus score
      const avgFocusScoreRaw =
        tasks.reduce((sum, task) => sum + focusValues[task.focus_level || task.focusLevel || 'medium'], 0) /
        tasks.length;
      const avgFocusScore = Math.round(avgFocusScoreRaw);
      const avgFocusLabel = Object.keys(focusValues).find(
        (key) => focusValues[key] === avgFocusScore
      );

      const weekStats = {
        total_tasks: tasks.length,
        total_hours: tasks
          .reduce((sum, task) => sum + (task.time_spent || task.timeSpent || 0), 0)
          .toFixed(1),
        avg_focus: avgFocusLabel,
      };

      // Call backend API
      const summaryData = {
        tasks: taskData,
        week_start: startDate.toISOString().split("T")[0],
        week_end: endDate.toISOString().split("T")[0],
        week_stats: weekStats,
        context_summaries: null,
      };

      const aiResult = await apiPost("/summaries/", summaryData);

      // The backend already saved the summary, so we use the returned data
      const generatedSummary = {
        ...aiResult,
        week: getWeek(startDate),
        year: getYear(startDate),
        weekStart: aiResult.week_start || startDate.toISOString(),
        weekEnd: aiResult.week_end || endDate.toISOString(),
        weekRange: `${format(startDate, "MMM dd")} - ${format(
          endDate,
          "MMM dd, yyyy"
        )}`,
        timestamp: new Date().toISOString(),
      };

      if (oldSummaryIfRegenerating) {
        onUpdateSummary(oldSummaryIfRegenerating, generatedSummary);
      } else {
        onAddSummary(generatedSummary);
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Regenerate summary by deleting current one and generating new
   */
  const handleRegenerateSummary = async () => {
    if (!summary || generating) return;

    const oldSummary = summary;

    try {
      setGenerating(true);
      setError(null);

      await apiDelete(`/summaries/${summary.id}`);

      await handleGenerateSummary(oldSummary);
    } catch (error) {
      console.error("Error regenerating summary:", error);
      setError("Failed to regenerate summary. Please try again.");
      setGenerating(false);
    }
  };

  return (
    <SummaryContainer>
      <SummaryList>
        <SummaryCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SummaryHeader>
            <SummaryMeta>
              <SummaryWeekRange>
                <Calendar
                  style={{
                    display: "inline",
                    marginRight: "8px",
                    width: "14px",
                    height: "14px",
                  }}
                />
                {`${format(
                  (summary ? new Date(summary.week_start) : startDate), 
                  "MMM dd")} - ${format(
                      (summary ? new Date(summary.week_end) : endDate),
                      "MMM dd, yyyy"
                    )}`}
              </SummaryWeekRange>
              {summary && summary.timestamp && (
                <SummaryTimestamp>
                  Generated{" "}
                  {summary.timestamp
                    ? format(new Date(summary.timestamp), "MMM dd, yyyy")
                    : "Recently"}
                </SummaryTimestamp>
              )}
            </SummaryMeta>
          </SummaryHeader>

          {summary ? (
            <>
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SearchProgressBar 
                      duration={8}
                      maxProgress={99}
                      variant="regenerate"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SummaryContent summary={summary} />
                  </motion.div>
                )}
              </AnimatePresence>
              <RegenerateButton
                onClick={handleRegenerateSummary}
                disabled={generating}
              >
                <RotateCcw size={12} />
                {generating ? "Regenerating..." : "Regenerate Summary"}
              </RegenerateButton>
            </>
          ) : (
            <GenerationSection>
              {!summary && tasks.length > 0 ? (
                <WeekSelector>
                  <GenerateButton
                    onClick={handleGenerateSummary}
                    disabled={generating || tasks.length === 0 || summary}
                    $generating={generating}
                    hasSummary={summary}
                    taskCount={tasks.length}
                  />
                  <WeekInfo>
                    <Clock
                      style={{
                        display: "inline",
                        marginRight: "8px",
                        width: "14px",
                        height: "14px",
                      }}
                    />
                    {tasks
                      .reduce((sum, task) => sum + (task.time_spent || task.timeSpent || 0), 0)
                      .toFixed(0)}
                    {" "}
                    hours •{" "}
                    {tasks.length} tasks
                  </WeekInfo>
                </WeekSelector>
              ) : (
                <EmptyState 
                  title="No tasks for this week"
                  description="Add some tasks and then we can generate a weekly summary"
                />
              )}

              {error && (
                <div className="mt-4">
                  <ErrorAlert
                    message={error}
                    type="error"
                  />
                </div>
              )}
            </GenerationSection>
          )}
        </SummaryCard>
      </SummaryList>
    </SummaryContainer>
  );
}

export default WeekSummary;
