import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Clock, Copy, Trash2, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

/**
 * Container for weekly summary section
 */
const SummaryContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * Summary generation section
 */
const GenerationSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 24px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.medium};
  `}
`;

/**
 * Section header
 */
const SectionHeader = styled.div`
  margin-bottom: 20px;
`;

/**
 * Section title
 */
const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}

  svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * Section description
 */
const SectionDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  line-height: 1.5;
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
`;

/**
 * Week info display
 */
const WeekInfo = styled.div`
  background: ${props => props.theme.colors.backgroundHover};
  padding: 12px 16px;
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
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
  flex-direction: column;
  gap: 4px;
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
 * Summary actions
 */
const SummaryActions = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Icon button for actions
 */
const IconButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  background: transparent;
  color: ${props => props.theme.colors.text.muted};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.backgroundHover};
    color: ${props => props.theme.colors.text.secondary};
    transform: scale(1.1);
    
    ${props => props.theme.name === 'tron' && `
      color: ${props.theme.colors.primary};
      text-shadow: ${props.theme.glow.small};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
  }
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
 * WeeklySummary component for AI-generated productivity insights
 */
function WeeklySummary({ tasks = [], summaries = [], onAddSummary = () => {} }) {
  const [generating, setGenerating] = useState(false);
  const [selectedWeek] = useState(new Date());
  const [error, setError] = useState(null);

  /**
   * Get tasks for the selected week
   */
  const weekTasks = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek);
    const weekEnd = endOfWeek(selectedWeek);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  }, [tasks, selectedWeek]);

  /**
   * Check if summary exists for current week
   */
  const existingSummary = useMemo(() => {
    const weekNumber = getWeek(new Date());
    const year = getYear(new Date());
    
    return summaries.find(summary => 
      summary.week === weekNumber && summary.year === year
    );
  }, [summaries]);

  /**
   * Generate a new weekly summary using GenAI
   */
  const handleGenerateSummary = async () => {
    if (weekTasks.length === 0) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Prepare task data for AI analysis
      const taskData = weekTasks.map(task => ({
        name: task.name,
        timeSpent: task.timeSpent,
        focusLevel: task.focusLevel,
        completed: task.completed || false,
        date: task.date
      }));

      // Calculate basic metrics (these are used by the backend API call)

      // Call backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: taskData,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          context: `Weekly productivity analysis for ${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const aiResult = await response.json();
      
      // The backend returns a properly formatted SummaryResponse
      const summary = {
        id: Date.now(),
        week: getWeek(selectedWeek),
        year: getYear(selectedWeek),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekRange: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
        stats: aiResult.stats,
        summary: aiResult.summary,
        insights: aiResult.insights,
        recommendations: aiResult.recommendations,
        timestamp: new Date().toISOString(),
        confidence: aiResult.confidence,
        generation_time: aiResult.generation_time
      };

      onAddSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Copy summary to clipboard
   */
  const handleCopySummary = (summary) => {
    const text = summary.summary;
    navigator.clipboard.writeText(text);
  };

  /**
   * Delete a summary
   */
  const handleDeleteSummary = (summaryId) => {
    // Implementation would remove from summaries array
    console.log('Delete summary:', summaryId);
  };

  const weekStart = startOfWeek(selectedWeek);
  const weekEnd = endOfWeek(selectedWeek);

  return (
    <SummaryContainer>
      <GenerationSection>
        <SectionHeader>
          <SectionTitle>
            <Sparkles />
            Generate Weekly Summary
          </SectionTitle>
          <SectionDescription>
            AI-powered insights and recommendations based on your productivity patterns
          </SectionDescription>
        </SectionHeader>

        <WeekSelector>
          <WeekInfo>
            <Calendar style={{ display: 'inline', marginRight: '8px', width: '14px', height: '14px' }} />
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </WeekInfo>
          <WeekInfo>
            <Clock style={{ display: 'inline', marginRight: '8px', width: '14px', height: '14px' }} />
            {weekTasks.length} tasks • {weekTasks.reduce((sum, task) => sum + task.timeSpent, 0).toFixed(1)}h total
          </WeekInfo>
        </WeekSelector>

        <GenerateButton
          onClick={handleGenerateSummary}
          disabled={generating || weekTasks.length === 0 || existingSummary}
          generating={generating}
        >
          {generating ? <RefreshCw /> : <Sparkles />}
          {generating ? 'Generating...' : 
           existingSummary ? 'Summary Already Generated' :
           weekTasks.length === 0 ? 'No Tasks This Week' : 'Generate AI Summary'}
        </GenerateButton>

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

      <SummaryList>
        <AnimatePresence>
          {summaries.length === 0 ? (
            <EmptyState>
              <h3>No summaries yet</h3>
              <p>Complete some tasks and generate your first weekly summary!</p>
            </EmptyState>
          ) : (
            summaries
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(summary => (
                <SummaryCard
                  key={summary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SummaryHeader>
                    <SummaryMeta>
                      <SummaryWeekRange>{summary.weekRange}</SummaryWeekRange>
                      <SummaryTimestamp>
                        Generated {format(new Date(summary.timestamp), 'MMM dd, yyyy')}
                      </SummaryTimestamp>
                    </SummaryMeta>
                    <SummaryActions>
                      <IconButton
                        onClick={() => handleCopySummary(summary)}
                        title="Copy summary"
                      >
                        <Copy />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteSummary(summary.id)}
                        title="Delete summary"
                      >
                        <Trash2 />
                      </IconButton>
                    </SummaryActions>
                  </SummaryHeader>

                  <SummaryStats>
                    <StatItem>
                      <StatValue>{summary.stats.totalTasks}</StatValue>
                      <StatLabel>Tasks</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{summary.stats.totalHours}h</StatValue>
                      <StatLabel>Hours</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{summary.stats.avgFocus}</StatValue>
                      <StatLabel>Avg Focus</StatLabel>
                    </StatItem>
                  </SummaryStats>

                  <SummaryContent>
                    <p>{summary.summary}</p>
                    
                    <h4>Key Insights</h4>
                    <ul>
                      {summary.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                    
                    <h4>Recommendations</h4>
                    <ul>
                      {summary.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </SummaryContent>
                </SummaryCard>
              ))
          )}
        </AnimatePresence>
      </SummaryList>
    </SummaryContainer>
  );
}

export default WeeklySummary; 