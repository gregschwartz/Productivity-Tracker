import React, { useState } from "react";
import styled from "styled-components";
import { Calendar, Clock } from "lucide-react";
import { format, getWeek, getYear } from "date-fns";
import { getApiUrl } from "../utils/api";
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
 * Display AI-generated productivity insights from a single week
 */
function WeekSummary({
  tasks = [],
  summary = null,
  timeRange,
  onAddSummary = () => {},
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
  const handleGenerateSummary = async () => {
    if (tasks.length === 0) return;

    setGenerating(true);
    setError(null);

    try {
      // Prepare task data for AI analysis
      const taskData = tasks.map((task) => ({
        name: task.name,
        timeSpent: task.timeSpent,
        focusLevel: task.focusLevel,
        date: task.date,
      }));

      // Calculate average focus score
      const avgFocusScoreRaw =
        tasks.reduce((sum, task) => sum + focusValues[task.focusLevel], 0) /
        tasks.length;
      const avgFocusScore = Math.round(avgFocusScoreRaw);
      const avgFocusLabel = Object.keys(focusValues).find(
        (key) => focusValues[key] === avgFocusScore
      );

      const weekStats = {
        totalTasks: tasks.length,
        totalHours: tasks
          .reduce((sum, task) => sum + task.timeSpent, 0)
          .toFixed(1),
        avgFocus: avgFocusLabel,
      };

      // Call backend API
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/summaries/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tasks: taskData,
            week_start: startDate.toISOString().split("T")[0],
            week_end: endDate.toISOString().split("T")[0],
            week_stats: weekStats,
            context_summaries: null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI summary");
      }

      const aiResult = await response.json();

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

      onAddSummary(generatedSummary);
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setError("Failed to generate summary. Please try again.");
    } finally {
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
                {summary
                  ? summary.weekRange
                  : `${format(startDate, "MMM dd")} - ${format(
                      endDate,
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
            <SummaryContent summary={summary} />
          ) : (
            <GenerationSection>
              {!summary && tasks.length > 0 ? (
                <WeekSelector>
                  <GenerateButton
                    onClick={handleGenerateSummary}
                    disabled={generating || tasks.length === 0 || summary}
                    generating={generating}
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
                    {tasks.length} tasks •{" "}
                    {tasks
                      .reduce((sum, task) => sum + task.timeSpent, 0)
                      .toFixed(1)}
                    h total
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
