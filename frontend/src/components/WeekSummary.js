import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Sparkles, Calendar, Clock, RefreshCw } from "lucide-react";
import { format, getWeek, getYear } from "date-fns";

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
 * Week info display
 */
const WeekInfo = styled.div.attrs(() => ({
  className: "text-sm",
}))`
  color: ${(props) => props.theme.colors.text.secondary};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    background: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.border};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Generate button styled component
 */
const GenerateButton = styled.button.attrs((props) => ({
  className: `flex items-center gap-2 px-6 py-3 border-none rounded-lg font-medium text-sm transition-all duration-200 ${
    props.disabled
      ? "cursor-not-allowed"
      : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
  }`,
  disabled: props.disabled,
}))`
  background: ${(props) =>
    props.disabled
      ? props.theme.colors.backgroundHover
      : props.theme.colors.primary};
  color: ${(props) =>
    props.disabled
      ? props.theme.colors.text.muted
      : props.theme.colors.primaryText};

  ${(props) =>
    props.theme.name === "tron" &&
    !props.disabled &&
    `
    border: 1px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.small};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover:not(:disabled) {
    ${(props) =>
      props.theme.name === "tron" &&
      `
      box-shadow: ${props.theme.glow.medium};
    `}
  }

  svg {
    width: 16px;
    height: 16px;

    ${(props) =>
      props.generating &&
      `
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Summary list container
 */
const SummaryList = styled.div.attrs(() => ({
  className: "flex flex-col gap-4",
}))``;

/**
 * Summary card styled component
 */
const SummaryCard = styled(motion.div).attrs(() => ({
  className:
    "p-6 border rounded-xl shadow-sm transition-all duration-200 w-full max-w-full md:w-[95%] md:mx-auto lg:w-[90%] hover:-translate-y-0.5 hover:shadow-lg",
}))`
  background: ${(props) => props.theme.colors.surface};
  border-color: ${(props) => props.theme.colors.border};

  &:hover {
    ${(props) =>
      props.theme.name === "tron" &&
      `
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

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
 * Summary week range
 */
const SummaryWeekRange = styled.h3.attrs(() => ({
  className: "text-lg font-semibold m-0",
}))`
  color: ${(props) => props.theme.colors.text.primary};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Summary timestamp
 */
const SummaryTimestamp = styled.p.attrs(() => ({
  className: "text-xs m-0",
}))`
  color: ${(props) => props.theme.colors.text.muted};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Summary content
 */
const SummaryContent = styled.div.attrs(() => ({
  className: "leading-relaxed",
}))`
  color: ${(props) => props.theme.colors.text.primary};

  h4 {
    color: ${(props) => props.theme.colors.primary};
    margin: 16px 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin-bottom: 12px;
  }

  ul {
    margin: 8px 0 16px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }
`;

/**
 * Empty state for no summaries
 */
const EmptyState = styled.div.attrs(() => ({
  className: "text-center py-15 px-5",
}))`
  color: ${(props) => props.theme.colors.text.muted};

  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${(props) => props.theme.colors.text.secondary};
  }

  p {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

/**
 * Display AI-generated productivity insights from a single week
 */
function WeekSummary({
  tasks = [],
  summary = null,
  contextSummaries = { before: [], after: [] },
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
        <div
          style={{
            padding: "24px",
            backgroundColor: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#991b1b",
          }}
        >
          <h3>Invalid Date Range</h3>
          <p>WeekSummary received invalid dates:</p>
          <ul>
            <li>
              startDate: {String(startDate)} (type: {typeof startDate})
            </li>
            <li>
              endDate: {String(endDate)} (type: {typeof endDate})
            </li>
          </ul>
        </div>
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
      console.log(avgFocusScoreRaw, avgFocusScore, avgFocusLabel);

      const weekStats = {
        totalTasks: tasks.length,
        totalHours: tasks
          .reduce((sum, task) => sum + task.timeSpent, 0)
          .toFixed(1),
        avgFocus: avgFocusLabel,
      };

      // Call backend API
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:8000/api"
        }/generate-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tasks: taskData,
            weekStart: startDate.toISOString().split("T")[0],
            weekEnd: endDate.toISOString().split("T")[0],
            weekStats: weekStats,
            contextSummaries: contextSummaries,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI summary");
      }

      const aiResult = await response.json();

      const generatedSummary = {
        week: getWeek(startDate),
        year: getYear(startDate),
        weekStart: startDate.toISOString(),
        weekEnd: endDate.toISOString(),
        weekRange: `${format(startDate, "MMM dd")} - ${format(
          endDate,
          "MMM dd, yyyy"
        )}`,
        stats: weekStats,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
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
            <SummaryContent>
              <p>{summary.summary}</p>

              {summary.recommendations &&
                summary.recommendations.length > 0 && (
                  <>
                    <h4>Recommendations for next week</h4>
                    <ul>
                      {summary.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          dangerouslySetInnerHTML={{ __html: rec }}
                        ></li>
                      ))}
                    </ul>
                  </>
                )}
            </SummaryContent>
          ) : (
            <GenerationSection>
              {summary && tasks.length > 0 ? (
                <WeekSelector>
                  <GenerateButton
                    onClick={handleGenerateSummary}
                    disabled={generating || tasks.length === 0 || summary}
                    generating={generating}
                  >
                    {generating ? <RefreshCw /> : <Sparkles />}
                    {generating
                      ? "Generating..."
                      : summary
                      ? "Summary Already Generated"
                      : tasks.length === 0
                      ? "No Tasks This Week"
                      : "Generate AI Summary"}
                  </GenerateButton>
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
                <EmptyState>
                  <h3>No tasks for this week</h3>
                  <p>
                    Add some tasks and then we can generate a weekly summary
                  </p>
                </EmptyState>
              )}

              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#fee2e2",
                    border: "1px solid #f87171",
                    borderRadius: "6px",
                    color: "#991b1b",
                    fontSize: "14px",
                  }}
                >
                  {error}
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
