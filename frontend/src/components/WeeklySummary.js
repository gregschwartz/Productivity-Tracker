import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components'; // Added keyframes
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval, parse } from 'date-fns'; // Using date-fns for robust date manipulation
import { ClipboardCopy, Check } from 'lucide-react'; // Added icons

// --- Styled Components ---
const WeeklySummaryContainer = styled.div`
  padding: 20px;
  font-family: 'Arial, sans-serif';
  color: ${({ theme }) => theme.text}; // Assuming theme provider
  background-color: ${({ theme }) => theme.background}; // Assuming theme provider
`;

const SectionTitle = styled.h2`
  font-size: 1.8em;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.primary};
`;

const GenerateButton = styled(motion.button)`
  background-color: ${({ theme, disabled }) => (disabled ? theme.disabled : theme.primary)};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme, disabled }) => (disabled ? theme.disabled : theme.primaryHover)};
  }
`;

const LoadingSpinner = styled(motion.div)`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block; /* Ensure it stays inline with text */

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

const ErrorMessage = styled(motion.p)`
  color: ${({ theme }) => theme.errorColor || '#d32f2f'}; /* Ensure theme.errorColor or a default */
  background-color: ${({ theme }) => theme.errorBackground || '#ffebee'}; /* Ensure theme.errorBackground or a default */
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.errorBorderColor || '#d32f2f'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const SummaryCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.3em;
    color: ${({ theme }) => theme.primary};
    margin-bottom: 10px;
  }

  p {
    font-size: 0.95em;
    line-height: 1.6;
    margin-bottom: 8px;
  }
`;

const StatsDisplay = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.borderColorMuted};

  p {
    font-size: 0.9em;
    margin-bottom: 5px;
    strong {
      color: ${({ theme }) => theme.textSecondary};
    }
  }
`;

const SubHeading = styled.h4`
  font-size: 1.1em;
  color: ${({ theme }) => theme.textSlightlyMuted};
  margin-top: 15px;
  margin-bottom: 5px;
`;

const NoSummariesMessage = styled.p`
  font-size: 1em;
  color: ${({ theme }) => theme.textSecondary};
`;

const CopyButton = styled(motion.button)` // Changed to motion.button
  background-color: ${({ theme, $isCopied }) => ($isCopied ? theme.success : theme.secondary)}; // Use theme.success
  color: white;
  padding: 6px 12px; /* Adjusted padding */
  border: none;
  border-radius: 4px;
  font-size: 0.8em;
  cursor: pointer;
  margin-top: 10px;
  float: right;
  display: flex; /* For icon alignment */
  align-items: center;
  gap: 5px; /* Space between icon and text */
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme, $isCopied }) => ($isCopied ? theme.successHover : theme.secondaryHover)};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

// --- Helper Functions (Conceptual - to be defined in utils/dateUtils.js) ---

// Assumed to be in utils/dateUtils.js
const getCurrentWeekDateRange = () => {
  const today = new Date();
  // Sunday as start of the week for date-fns
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  return {
    start: format(weekStart, 'yyyy-MM-dd'),
    end: format(weekEnd, 'yyyy-MM-dd'),
  };
};

const isTaskInCurrentWeek = (task, currentWeekStart, currentWeekEnd) => {
  if (!task.date) return false;
  try {
    // Try parsing with common formats. Robust parsing might be needed.
    let taskDate;
    if (task.date instanceof Date) {
        taskDate = task.date;
    } else if (typeof task.date === 'string') {
        if (task.date.includes('T')) { // ISO with time
            taskDate = parseISO(task.date);
        } else { // Just date string 'yyyy-MM-dd'
            taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
        }
    } else {
        return false; // Invalid date format
    }

    const weekStartDate = parse(currentWeekStart, 'yyyy-MM-dd', new Date());
    const weekEndDate = parse(currentWeekEnd, 'yyyy-MM-dd', new Date());

    return isWithinInterval(taskDate, { start: weekStartDate, end: weekEndDate });
  } catch (error) {
    console.error("Error parsing task date:", task.date, error);
    return false;
  }
};

const summaryExistsForWeek = (summaries, weekStart) => {
  return summaries.some(summary => summary.week_start === weekStart);
};


// --- WeeklySummary Component ---
const WeeklySummary = ({
  tasks = [],
  summaries = [],
  isLoading = false,
  error = null,
  onGenerateSummary,
}) => {
  const [copiedSummaryId, setCopiedSummaryId] = useState(null);

  const currentWeek = useMemo(() => getCurrentWeekDateRange(), []);

  const currentWeekTasks = useMemo(() => {
    return tasks.filter(task => isTaskInCurrentWeek(task, currentWeek.start, currentWeek.end));
  }, [tasks, currentWeek.start, currentWeek.end]);

  const isCurrentWeekSummaryGenerated = useMemo(() => {
    return summaryExistsForWeek(summaries, currentWeek.start);
  }, [summaries, currentWeek.start]);

  const handleGenerateSummary = async () => {
    if (!onGenerateSummary || currentWeekTasks.length === 0 || isCurrentWeekSummaryGenerated) return;
    await onGenerateSummary(currentWeekTasks, currentWeek.start, currentWeek.end);
  };

  const handleCopyToClipboard = (summaryText, summaryId) => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedSummaryId(summaryId);
      setTimeout(() => setCopiedSummaryId(null), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy summary: ', err);
      // Optionally show an error to the user
    });
  };

  // Sort summaries by week_start date, newest first
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => new Date(b.week_start) - new Date(a.week_start));
  }, [summaries]);

  return (
    <WeeklySummaryContainer>
      <SectionTitle>Weekly Productivity Summary</SectionTitle>

      <GenerateButton
        onClick={handleGenerateSummary}
        disabled={isLoading || currentWeekTasks.length === 0 || isCurrentWeekSummaryGenerated}
        disabled={isLoading || currentWeekTasks.length === 0 || isCurrentWeekSummaryGenerated}
        variants={{
          idle: { scale: 1, opacity: 1 },
          loading: {
            scale: [1, 1.02, 1],
            opacity: [1, 0.8, 1],
            transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
          }
        }}
        animate={isLoading ? "loading" : "idle"}
        whileHover={{ scale: (isLoading || currentWeekTasks.length === 0 || isCurrentWeekSummaryGenerated) ? 1 : 1.03 }}
        whileTap={{ scale: (isLoading || currentWeekTasks.length === 0 || isCurrentWeekSummaryGenerated) ? 1 : 0.97 }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            Analyzing week...
          </>
        ) : (
          'Generate Report for Current Week'
        )}
      </GenerateButton>
      {currentWeekTasks.length === 0 && !isLoading && (
        <p>No tasks found for the current week ({currentWeek.start} to {currentWeek.end}) to generate a report.</p>
      )}
      {isCurrentWeekSummaryGenerated && !isLoading && (
        <p>Summary for the current week ({currentWeek.start} to {currentWeek.end}) has already been generated.</p>
      )}

      <AnimatePresence>
        {error && (
          <ErrorMessage
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div initial={{ rotate: 0 }} animate={{ rotate: [0, -5, 5, -5, 5, 0], transition: { duration:0.4, delay: 0.1}}}>
              ⚠️
            </motion.div>
            Error: {error}
          </ErrorMessage>
        )}
      </AnimatePresence>

      <SectionTitle>Past Summaries</SectionTitle>
      {sortedSummaries.length === 0 && !isLoading && (
        <NoSummariesMessage>No summaries yet. Generate your first weekly report!</NoSummariesMessage>
      )}
      <SummaryList>
        <AnimatePresence>
          {sortedSummaries.map((summary) => (
            <SummaryCard
              key={summary.id || summary.week_start}
              layout
              initial={{ opacity: 0, y: 60, rotateX: -45, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.05 }} // Stagger animation slightly
            >
              <h3>Week of {summary.week_start}</h3>
              <CopyButton
                onClick={() => handleCopyToClipboard(summary.summary, summary.id || summary.week_start)}
                $isCopied={copiedSummaryId === (summary.id || summary.week_start)}
                whileHover={{ scale: copiedSummaryId === (summary.id || summary.week_start) ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copiedSummaryId === (summary.id || summary.week_start) ? <Check size={14}/> : <ClipboardCopy size={14} />}
                {copiedSummaryId === (summary.id || summary.week_start) ? 'Copied!' : 'Copy'}
              </CopyButton>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: {delay: 0.2 + index * 0.05}}}>{summary.summary}</motion.p>

              {summary.insights && summary.insights.length > 0 && (
                <>
                  <SubHeading>Insights:</SubHeading>
                  <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1, transition: {delay: 0.3 + index * 0.05}}}>
                    {summary.insights.map((insight, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0, transition: {delay: 0.35 + index * 0.05 + i * 0.03}}}
                      >
                        {insight}
                      </motion.li>
                    ))}
                  </motion.ul>
                </>
              )}

              {summary.recommendations && summary.recommendations.length > 0 && (
                <>
                  <SubHeading>Recommendations:</SubHeading>
                  <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1, transition: {delay: 0.4 + index * 0.05}}}>
                    {summary.recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0, transition: {delay: 0.45 + index * 0.05 + i * 0.03}}}
                      >
                        {rec}
                      </motion.li>
                    ))}
                  </motion.ul>
                </>
              )}

              {summary.stats && (
                <StatsDisplay as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: {delay: 0.5 + index * 0.05}}}>
                  <p><strong>Total Tasks:</strong> {summary.stats.totalTasks}</p>
                  <p><strong>Total Hours:</strong> {summary.stats.totalHours}</p>
                  <p><strong>Average Focus:</strong> {summary.stats.avgFocus}</p>
                </StatsDisplay>
              )}
            </SummaryCard>
          ))}
        </AnimatePresence>
      </SummaryList>
    </WeeklySummaryContainer>
  );
};

export default WeeklySummary;
