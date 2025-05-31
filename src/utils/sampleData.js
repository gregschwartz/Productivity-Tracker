/**
 * Sample data for demonstrating the productivity tracker
 */

import { format, subDays } from 'date-fns';

/**
 * Generate sample tasks for the last few days
 */
export const generateSampleTasks = () => {
  const sampleTasks = [
    // Today
    {
      id: Date.now() + 1,
      name: "Code review for authentication module",
      timeSpent: 2.5,
      focusLevel: "high",
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      name: "Team standup meeting",
      timeSpent: 0.5,
      focusLevel: "medium",
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    },
    {
      id: Date.now() + 3,
      name: "Design system documentation",
      timeSpent: 1.5,
      focusLevel: "medium",
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    },

    // Yesterday
    {
      id: Date.now() + 4,
      name: "Bug fixes in payment processing",
      timeSpent: 3.0,
      focusLevel: "high",
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 1).toISOString()
    },
    {
      id: Date.now() + 5,
      name: "Client meeting - project requirements",
      timeSpent: 1.0,
      focusLevel: "medium",
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 1).toISOString()
    },
    {
      id: Date.now() + 6,
      name: "Research new React patterns",
      timeSpent: 2.0,
      focusLevel: "high",
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 1).toISOString()
    },

    // 2 days ago
    {
      id: Date.now() + 7,
      name: "Database optimization work",
      timeSpent: 4.0,
      focusLevel: "high",
      date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 2).toISOString()
    },
    {
      id: Date.now() + 8,
      name: "Email and administrative tasks",
      timeSpent: 1.0,
      focusLevel: "low",
      date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 2).toISOString()
    },

    // 3 days ago
    {
      id: Date.now() + 9,
      name: "Frontend component development",
      timeSpent: 5.0,
      focusLevel: "high",
      date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 3).toISOString()
    },
    {
      id: Date.now() + 10,
      name: "Testing and QA session",
      timeSpent: 2.5,
      focusLevel: "medium",
      date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 3).toISOString()
    },

    // 4 days ago
    {
      id: Date.now() + 11,
      name: "API endpoint design",
      timeSpent: 3.5,
      focusLevel: "high",
      date: format(subDays(new Date(), 4), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 4).toISOString()
    },
    {
      id: Date.now() + 12,
      name: "Weekly planning session",
      timeSpent: 1.5,
      focusLevel: "medium",
      date: format(subDays(new Date(), 4), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 4).toISOString()
    },

    // 5 days ago
    {
      id: Date.now() + 13,
      name: "Code refactoring - authentication",
      timeSpent: 4.5,
      focusLevel: "high",
      date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 5).toISOString()
    },
    {
      id: Date.now() + 14,
      name: "Mentoring junior developer",
      timeSpent: 1.0,
      focusLevel: "medium",
      date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 5).toISOString()
    },

    // 6 days ago
    {
      id: Date.now() + 15,
      name: "Performance optimization analysis",
      timeSpent: 3.0,
      focusLevel: "high",
      date: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 6).toISOString()
    },
    {
      id: Date.now() + 16,
      name: "Documentation updates",
      timeSpent: 2.0,
      focusLevel: "low",
      date: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
      timestamp: subDays(new Date(), 6).toISOString()
    }
  ];

  return sampleTasks;
};

/**
 * Generate sample weekly summaries
 */
export const generateSampleSummaries = () => {
  const sampleSummaries = [
    {
      id: Date.now() + 100,
      week: 47,
      year: 2024,
      weekStart: subDays(new Date(), 7).toISOString(),
      weekEnd: new Date().toISOString(),
      weekRange: `${format(subDays(new Date(), 7), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`,
      stats: {
        totalTasks: 12,
        totalHours: "28.5",
        avgFocus: "2.3",
        topFocus: "high"
      },
      summary: "This week you completed 12 tasks with a total time investment of 28.5 hours. Your focus levels averaged 2.3/3, with most tasks falling in the 'high' focus category. You showed excellent productivity in coding and development work.",
      insights: [
        "High productivity week with excellent time investment in development tasks.",
        "Strong focus levels maintained across coding and technical work.",
        "Good balance between deep work and collaborative activities."
      ],
      recommendations: [
        "Continue maintaining current deep work sessions - they're working well",
        "Consider batching similar coding tasks for even better flow states",
        "Schedule administrative tasks during lower-energy periods"
      ],
      timestamp: new Date().toISOString()
    },
    {
      id: Date.now() + 101,
      week: 46,
      year: 2024,
      weekStart: subDays(new Date(), 14).toISOString(),
      weekEnd: subDays(new Date(), 7).toISOString(),
      weekRange: `${format(subDays(new Date(), 14), 'MMM dd')} - ${format(subDays(new Date(), 7), 'MMM dd, yyyy')}`,
      stats: {
        totalTasks: 15,
        totalHours: "32.0",
        avgFocus: "2.1",
        topFocus: "medium"
      },
      summary: "This week you completed 15 tasks with a total time investment of 32.0 hours. Your focus levels averaged 2.1/3, with most tasks falling in the 'medium' focus category. Heavy meeting schedule impacted deep work time.",
      insights: [
        "Higher task volume but with more interruptions than usual.",
        "Meeting-heavy week reduced available deep work time.",
        "Good progress on project deliverables despite scheduling challenges."
      ],
      recommendations: [
        "Try blocking morning hours for deep work before meetings",
        "Consider declining non-essential meetings to protect focus time",
        "Batch meetings into specific days when possible"
      ],
      timestamp: subDays(new Date(), 7).toISOString()
    }
  ];

  return sampleSummaries;
};

/**
 * Load sample data into localStorage if no data exists
 */
export const loadSampleDataIfEmpty = () => {
  const existingTasks = JSON.parse(localStorage.getItem('productivity-tasks') || '[]');
  const existingSummaries = JSON.parse(localStorage.getItem('weekly-summaries') || '[]');

  if (!existingTasks || existingTasks.length === 0) {
    console.log('No tasks found, generating sample tasks');
    const sampleTasks = generateSampleTasks();
    localStorage.setItem('productivity-tasks', JSON.stringify(sampleTasks));
    console.log('Sample tasks loaded:', sampleTasks.length, 'tasks');
  }

  if (!existingSummaries || existingSummaries.length === 0) {
    const sampleSummaries = generateSampleSummaries();
    localStorage.setItem('weekly-summaries', JSON.stringify(sampleSummaries));
    console.log('Sample summaries loaded:', sampleSummaries.length, 'summaries');
  }
}; 