import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Clock, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

const focusValues = { low: 1, medium: 2, high: 3 };

/**
 * Container for weekly summary section
 */
const SummaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 24px;
  
  @media (min-width: 768px) {
    padding: 0 48px;
  }
`;

/**
 * Summary generation section
 */
const GenerationSection = styled.div`
  padding: 0 0;
`;


/**
 * Week selector styled component
 */
const WeekSelector = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

/**
 * Week info display
 */
const WeekInfo = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.border};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Generate button styled component
 */
const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.disabled ? props.theme.colors.backgroundHover : props.theme.colors.primary};
  color: ${props => props.disabled ? props.theme.colors.text.muted : props.theme.colors.primaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  ${props => props.theme.name === 'tron' && !props.disabled && `
    border: 1px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.small};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
    
    ${props => props.generating && `
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

/**
 * Summary list container
 */
const SummaryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Summary card styled component
 */
const SummaryCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 24px;
  box-shadow: ${props => props.theme.shadows.small};
  transition: all 0.2s ease;
  width: 100%;
  max-width: 100%;
  
  @media (min-width: 768px) {
    width: 95%;
    margin: 0 auto;
  }
  
  @media (min-width: 1024px) {
    width: 90%;
  }
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.shadows.medium};
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Summary header
 */
const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

/**
 * Summary meta information
 */
const SummaryMeta = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

/**
 * Summary week range
 */
const SummaryWeekRange = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Summary timestamp
 */
const SummaryTimestamp = styled.p`
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Summary stats grid
 */
const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: ${props => props.theme.colors.backgroundHover};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
`;

/**
 * Individual stat item
 */
const StatItem = styled.div`
  text-align: center;
`;

/**
 * Stat value
 */
const StatValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-shadow: ${props.theme.glow.small};
  `}
`;

/**
 * Stat label
 */
const StatLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
  margin-top: 4px;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * Summary content
 */
const SummaryContent = styled.div`
  line-height: 1.6;
  color: ${props => props.theme.colors.text.primary};
  
  h4 {
    color: ${props => props.theme.colors.primary};
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
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.text.muted};
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text.secondary};
  }
  
  p {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

/**
 * Display AI-generated productivity insights from a single week
 */
function WeekSummary({ tasks = [], summary = null, contextSummaries = { before: [], after: [] }, timeRange, onAddSummary = () => {} }) {
  const { startDate, endDate } = timeRange;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Show error if invalid dates are passed
  if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate)) {
    return (
      <SummaryContainer>
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#fee2e2', 
          border: '1px solid #f87171', 
          borderRadius: '6px', 
          color: '#991b1b' 
        }}>
          <h3>Invalid Date Range</h3>
          <p>WeekSummary received invalid dates:</p>
          <ul>
            <li>startDate: {String(startDate)} (type: {typeof startDate})</li>
            <li>endDate: {String(endDate)} (type: {typeof endDate})</li>
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
      const taskData = tasks.map(task => ({
        name: task.name,
        timeSpent: task.timeSpent,
        focusLevel: task.focusLevel,
        date: task.date
      }));

      // Calculate average focus score
      const avgFocusScoreRaw = tasks.reduce((sum, task) => sum + focusValues[task.focusLevel], 0) / tasks.length;
      const avgFocusScore = Math.round(avgFocusScoreRaw);
      const avgFocusLabel = Object.keys(focusValues).find(key => focusValues[key] === avgFocusScore);
      console.log(avgFocusScoreRaw, avgFocusScore, avgFocusLabel);

      const weekStats = {
        totalTasks: tasks.length,
        totalHours: tasks.reduce((sum, task) => sum + task.timeSpent, 0).toFixed(1),
        avgFocus: avgFocusLabel
      };

      // Call backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: taskData,
          weekStart: startDate.toISOString().split('T')[0],
          weekEnd: endDate.toISOString().split('T')[0],
          weekStats: weekStats,
          contextSummaries: contextSummaries
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const aiResult = await response.json();
      
      const generatedSummary = {
        week: getWeek(startDate),
        year: getYear(startDate),
        weekStart: startDate.toISOString(),
        weekEnd: endDate.toISOString(),
        weekRange: `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`,
        stats: weekStats,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
        timestamp: new Date().toISOString()
      };

      onAddSummary(generatedSummary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setError('Failed to generate summary. Please try again.');
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
                <Calendar style={{ display: 'inline', marginRight: '8px', width: '14px', height: '14px' }} />
                {summary 
                ? summary.weekRange 
                : `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`}
              </SummaryWeekRange>
              { summary && summary.timestamp && (
                <SummaryTimestamp>
                  Generated {summary.timestamp ? format(new Date(summary.timestamp), 'MMM dd, yyyy') : 'Recently'}
                </SummaryTimestamp>
              )}
            </SummaryMeta>
          </SummaryHeader>

          {summary ? (
            <SummaryContent>
              <p>{summary.summary}</p>
              
              {summary.recommendations && summary.recommendations.length > 0 && (
                <>
                  <h4>Recommendations for next week</h4>
                  <ul>
                    {summary.recommendations.map((rec, index) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: rec }}></li>
                    ))}
                  </ul>
                </>
              )}
            </SummaryContent>
          ) : (
            <GenerationSection>
              <WeekSelector>

                <GenerateButton
                  onClick={handleGenerateSummary}
                  disabled={generating || tasks.length === 0 || summary}
                  generating={generating}
                >
                  {generating ? <RefreshCw /> : <Sparkles />}
                  {generating ? 'Generating...' : 
                  summary ? 'Summary Already Generated' :
                  tasks.length === 0 ? 'No Tasks This Week' : 'Generate AI Summary'}
                </GenerateButton>
                <WeekInfo>
                  <Clock style={{ display: 'inline', marginRight: '8px', width: '14px', height: '14px' }} />
                  {tasks.length} tasks • {tasks.reduce((sum, task) => sum + task.timeSpent, 0).toFixed(1)}h total
                </WeekInfo>
              </WeekSelector>

              {error && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#fee2e2', 
                  border: '1px solid #f87171', 
                  borderRadius: '6px', 
                  color: '#991b1b',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
            </GenerationSection>
          )}
        </SummaryCard>
      </SummaryList>

      {!summary && tasks.length === 0 && (
        <EmptyState>
          <h3>No tasks for this week</h3>
          <p>Add some tasks and then we can generate a weekly summary</p>
        </EmptyState>
      )}
    </SummaryContainer>
  );
}

export default WeekSummary; 