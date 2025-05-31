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
 * Generate a mock AI summary (simulates API call)
 */
const generateMockSummary = (tasks, weekStart, weekEnd) => {
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
  const focusDistribution = tasks.reduce((acc, task) => {
    acc[task.focusLevel] = (acc[task.focusLevel] || 0) + 1;
    return acc;
  }, {});
  
  const avgFocus = tasks.length > 0 
    ? tasks.reduce((sum, task) => {
        const focusValues = { low: 1, medium: 2, high: 3 };
        return sum + focusValues[task.focusLevel];
      }, 0) / tasks.length
    : 0;

  // Simulate AI-generated insights
  const insights = [
    totalHours > 25 ? "High productivity week with excellent time investment." : 
    totalHours > 15 ? "Good productivity levels maintained throughout the week." :
    "Lower activity week - consider setting more structured goals.",
    
    avgFocus > 2.3 ? "Excellent focus levels maintained across tasks." :
    avgFocus > 1.7 ? "Moderate focus levels - room for improvement in deep work." :
    "Focus levels could be enhanced with better time management.",
    
    totalTasks > 15 ? "High task completion rate shows strong momentum." :
    totalTasks > 8 ? "Steady task completion pace maintained." :
    "Consider breaking larger tasks into smaller, manageable chunks."
  ];

  const recommendations = [
    totalHours < 20 ? "Try time-blocking to increase focused work sessions" : "Maintain current time investment patterns",
    avgFocus < 2 ? "Schedule deep work blocks during your peak energy hours" : "Continue leveraging your high-focus periods",
    totalTasks < 10 ? "Set daily micro-goals to build momentum" : "Consider task batching for similar activities"
  ];

  return {
    weekRange: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
    stats: {
      totalTasks,
      totalHours: totalHours.toFixed(1),
      avgFocus: avgFocus.toFixed(1),
      topFocus: Object.keys(focusDistribution).reduce((a, b) => 
        focusDistribution[a] > focusDistribution[b] ? a : b, 'medium')
    },
    summary: `This week you completed ${totalTasks} tasks with a total time investment of ${totalHours.toFixed(1)} hours. Your focus levels averaged ${avgFocus.toFixed(1)}/3, with most tasks falling in the '${Object.keys(focusDistribution).reduce((a, b) => focusDistribution[a] > focusDistribution[b] ? a : b, 'medium')}' focus category.`,
    insights,
    recommendations
  };
};

/**
 * WeeklySummary component for AI-generated productivity insights
 */
function WeeklySummary({ tasks = [], summaries = [], onAddSummary = () => {} }) {
  const [generating, setGenerating] = useState(false);

  /**
   * Get tasks for the selected week
   */
  const weekTasks = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
  }, [tasks]);

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
    
    try {
      // Prepare task data for AI analysis
      const taskData = weekTasks.map(task => ({
        name: task.name,
        timeSpent: task.timeSpent,
        focusLevel: task.focusLevel,
        completed: task.completed || false,
        date: task.date
      }));

      // Calculate basic metrics
      const totalHours = weekTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
      const completedTasks = weekTasks.filter(task => task.completed).length;
      const avgFocus = weekTasks.length > 0 
        ? weekTasks.reduce((sum, task) => {
            const focusValues = { low: 1, medium: 2, high: 3 };
            return sum + (focusValues[task.focusLevel] || 1);
          }, 0) / weekTasks.length
        : 0;

      // Call GenAI API
      const response = await fetch('https://ai.pydantic.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          prompt: `Analyze this week's productivity data and provide insights. Generate a summary paragraph and actionable recommendations.

Weekly Data:
- Total tasks: ${weekTasks.length}
- Completed tasks: ${completedTasks}
- Total hours: ${totalHours.toFixed(1)}
- Average focus level: ${avgFocus.toFixed(1)}/3

Tasks:
${taskData.map(task => `- ${task.name} (${task.timeSpent}h, ${task.focusLevel} focus, ${task.completed ? 'completed' : 'pending'})`).join('\n')}

Please provide:
1. A one-paragraph summary of productivity patterns
2. 3-5 specific insights about work habits
3. 3-5 actionable recommendations for next week

Format as JSON with fields: summary, insights (array), recommendations (array)`,
          tasks: taskData,
          metrics: {
            totalTasks: weekTasks.length,
            completedTasks,
            totalHours: totalHours.toFixed(1),
            avgFocus: avgFocus.toFixed(1)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const aiResult = await response.json();
      
      // Parse AI response
      let aiSummary;
      try {
        aiSummary = typeof aiResult === 'string' ? JSON.parse(aiResult) : aiResult;
      } catch {
        // Fallback if JSON parsing fails
        aiSummary = {
          summary: aiResult.summary || `This week you completed ${completedTasks} out of ${weekTasks.length} tasks, spending ${totalHours.toFixed(1)} hours on productivity work.`,
          insights: aiResult.insights || ['Focus levels varied throughout the week'],
          recommendations: aiResult.recommendations || ['Continue tracking tasks for better insights']
        };
      }

      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const summary = {
        id: Date.now(),
        week: getWeek(new Date()),
        year: getYear(new Date()),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekRange: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
        stats: {
          totalTasks: weekTasks.length,
          totalHours: totalHours.toFixed(1),
          avgFocus: avgFocus.toFixed(1),
          topFocus: avgFocus >= 2.5 ? 'high' : avgFocus >= 1.5 ? 'medium' : 'low'
        },
        summary: aiSummary.summary,
        insights: Array.isArray(aiSummary.insights) ? aiSummary.insights : [aiSummary.insights || 'AI analysis completed'],
        recommendations: Array.isArray(aiSummary.recommendations) ? aiSummary.recommendations : [aiSummary.recommendations || 'Continue current productivity practices'],
        timestamp: new Date().toISOString()
      };

      onAddSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      
      // Fallback to local summary if API fails
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const mockSummary = generateMockSummary(weekTasks, weekStart, weekEnd);
      
      const summary = {
        week: getWeek(new Date()),
        year: getYear(new Date()),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        ...mockSummary
      };

      onAddSummary(summary);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Copy summary to clipboard
   */
  const handleCopySummary = (summary) => {
    const text = `Week ${summary.weekRange}\n\n${summary.summary}\n\nInsights:\n${summary.insights.map(i => `• ${i}`).join('\n')}\n\nRecommendations:\n${summary.recommendations.map(r => `• ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  /**
   * Delete a summary
   */
  const handleDeleteSummary = (summaryId) => {
    // Implementation would remove from summaries array
    console.log('Delete summary:', summaryId);
  };

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

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
                      <StatValue>{summary.stats.avgFocus}/3</StatValue>
                      <StatLabel>Avg Focus</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{summary.stats.topFocus}</StatValue>
                      <StatLabel>Top Focus</StatLabel>
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