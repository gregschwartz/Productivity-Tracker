/**
 * Sample data for demonstrating the productivity tracker
 */

import { format, subDays } from 'date-fns';

/**
 * Generate sample tasks for the last two months
 */
export const generateSampleTasks = () => {
  // timeMinMax is [minHours, maxHours] - used to generate random time spent within this range
  const taskTemplates = [
    // Development tasks
    { name: "Frontend component development", timeMinMax: [2, 6], focusLevel: "high" },
    { name: "Backend API implementation", timeMinMax: [3, 5], focusLevel: "high" },
    { name: "Database optimization work", timeMinMax: [2, 4], focusLevel: "high" },
    { name: "Code review for authentication module", timeMinMax: [1, 3], focusLevel: "high" },
    { name: "Bug fixes in payment processing", timeMinMax: [2, 4], focusLevel: "high" },
    { name: "Performance optimization analysis", timeMinMax: [2, 5], focusLevel: "high" },
    { name: "Code refactoring - authentication", timeMinMax: [3, 6], focusLevel: "high" },
    { name: "API endpoint design", timeMinMax: [2, 4], focusLevel: "high" },
    { name: "Unit testing implementation", timeMinMax: [1, 3], focusLevel: "medium" },
    { name: "Integration testing setup", timeMinMax: [2, 4], focusLevel: "medium" },
    
    // Meetings and collaboration
    { name: "Team standup meeting", timeMinMax: [0.25, 0.5], focusLevel: "medium" },
    { name: "Sprint planning session", timeMinMax: [1, 2], focusLevel: "medium" },
    { name: "Client meeting - project requirements", timeMinMax: [0.5, 1.5], focusLevel: "medium" },
    { name: "Weekly retrospective", timeMinMax: [0.5, 1], focusLevel: "medium" },
    { name: "Architecture discussion", timeMinMax: [1, 2], focusLevel: "medium" },
    { name: "Code review session", timeMinMax: [1, 2], focusLevel: "medium" },
    { name: "Mentoring junior developer", timeMinMax: [0.5, 1.5], focusLevel: "medium" },
    { name: "Cross-team collaboration", timeMinMax: [1, 2], focusLevel: "medium" },
    
    // Documentation and admin
    { name: "Design system documentation", timeMinMax: [1, 3], focusLevel: "medium" },
    { name: "Technical specification writing", timeMinMax: [2, 4], focusLevel: "medium" },
    { name: "Documentation updates", timeMinMax: [1, 3], focusLevel: "low" },
    { name: "Email and administrative tasks", timeMinMax: [0.5, 1.5], focusLevel: "low" },
    { name: "Weekly planning session", timeMinMax: [1, 2], focusLevel: "low" },
    { name: "Project status reporting", timeMinMax: [0.5, 1], focusLevel: "low" },
    { name: "Time tracking and reporting", timeMinMax: [0.25, 0.5], focusLevel: "low" },
    
    // Research and learning
    { name: "Research new React patterns", timeMinMax: [1, 3], focusLevel: "high" },
    { name: "Technology evaluation", timeMinMax: [2, 4], focusLevel: "high" },
    { name: "Learning new framework", timeMinMax: [2, 5], focusLevel: "high" },
    { name: "Security research and analysis", timeMinMax: [2, 4], focusLevel: "high" },
    { name: "Industry best practices review", timeMinMax: [1, 3], focusLevel: "medium" },
    
    // QA and testing
    { name: "Testing and QA session", timeMinMax: [1, 3], focusLevel: "medium" },
    { name: "Manual testing workflow", timeMinMax: [1, 2], focusLevel: "medium" },
    { name: "Automated test maintenance", timeMinMax: [1, 3], focusLevel: "medium" },
    { name: "Bug investigation and analysis", timeMinMax: [1, 4], focusLevel: "high" }
  ];

  const sampleTasks = [];
  let taskId = Date.now();

  // Generate tasks for the last 60 days
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const date = subDays(new Date(), dayOffset);
    const dateStr = format(date, 'yyyy-MM-dd');
    const timestamp = date.toISOString();
    
    // Determine number of tasks for this day
    let taskCount;
    if (dayOffset === 0) {
      taskCount = Math.floor(Math.random() * 3) + 1; // 1-3 tasks for today
    } else {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      taskCount = isWeekend 
        ? Math.floor(Math.random() * 2) // 0-1 tasks on weekends
        : Math.floor(Math.random() * 5) + 1; // 1-5 tasks on weekdays
    }
    
    // Generate tasks for this day
    for (let i = 0; i < taskCount; i++) {
      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];

      // Generate random time spent within the task's min and max hour range
      const timeSpent = template.timeMinMax[0] + 
        Math.random() * (template.timeMinMax[1] - template.timeMinMax[0]);
      
      sampleTasks.push({
        id: taskId++,
        name: template.name,
        timeSpent: Math.round(timeSpent * 4) / 4, // Round to nearest 0.25
        focusLevel: template.focusLevel,
        date: dateStr,
        timestamp: timestamp
      });
    }
  }

  return sampleTasks;
};

/**
 * Generate sample weekly summaries for the last two months
 */
export const generateSampleSummaries = () => {
  const summaryTemplates = [
    {
      summary: "Excellent week with strong focus on development work and good time management across all tasks.",
      insights: [
        "High productivity week with excellent time investment in development tasks.",
        "Strong focus levels maintained across coding and technical work.",
        "Good balance between deep work and collaborative activities."
      ],
      recommendations: [
        "Continue maintaining current deep work sessions - they're working well",
        "Consider batching similar coding tasks for even better flow states",
        "Schedule administrative tasks during lower-energy periods"
      ]
    },
    {
      summary: "Heavy meeting schedule impacted deep work time, but good progress on deliverables despite challenges.",
      insights: [
        "Higher task volume but with more interruptions than usual.",
        "Meeting-heavy week reduced available deep work time.",
        "Good progress on project deliverables despite scheduling challenges."
      ],
      recommendations: [
        "Try blocking morning hours for deep work before meetings",
        "Consider declining non-essential meetings to protect focus time",
        "Batch meetings into specific days when possible"
      ]
    },
    {
      summary: "Strong week with focus on learning and skill development, balanced with project deliverables.",
      insights: [
        "Significant time invested in learning new technologies and patterns.",
        "Good balance between research and implementation work.",
        "Maintained consistent productivity across different task types."
      ],
      recommendations: [
        "Continue allocating time for learning - it's paying dividends",
        "Document key learnings for future reference",
        "Share insights with team members for collective growth"
      ]
    },
    {
      summary: "Productive week with emphasis on code quality and testing, showing attention to long-term maintainability.",
      insights: [
        "Strong focus on code quality and testing initiatives.",
        "Good investment in technical debt reduction.",
        "Balanced approach between new features and maintenance."
      ],
      recommendations: [
        "Keep prioritizing testing and code quality initiatives",
        "Consider establishing testing standards for the team",
        "Document refactoring patterns for future reference"
      ]
    },
    {
      summary: "Collaborative week with strong team engagement and knowledge sharing across multiple projects.",
      insights: [
        "High level of team collaboration and mentoring activities.",
        "Good cross-team communication and project coordination.",
        "Effective knowledge sharing and skill development."
      ],
      recommendations: [
        "Continue fostering collaborative environment",
        "Consider formalizing mentoring processes",
        "Schedule regular knowledge sharing sessions"
      ]
    },
    {
      summary: "Focus week with deep work sessions producing significant progress on core development tasks.",
      insights: [
        "Extended periods of focused development work.",
        "Minimal interruptions allowed for deep problem solving.",
        "High-quality output from concentrated effort."
      ],
      recommendations: [
        "Protect these deep work periods - they're highly effective",
        "Consider establishing 'focus hours' for the team",
        "Use this momentum for complex architectural decisions"
      ]
    }
  ];

  const sampleSummaries = [];
  let summaryId = Date.now() + 100;

  // Generate summaries for the last 8 weeks (approximately 2 months)
  for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
    const weekStart = subDays(new Date(), (weekOffset + 1) * 7);
    const weekEnd = subDays(new Date(), weekOffset * 7);
    const template = summaryTemplates[weekOffset % summaryTemplates.length];
    
    // Simulate realistic stats
    const totalTasks = 8 + Math.floor(Math.random() * 12); // 8-20 tasks per week
    const totalHours = (totalTasks * (1.5 + Math.random() * 2)).toFixed(1); // 1.5-3.5 hours per task
    const avgFocusValue = 1.5 + Math.random() * 1.5; // 1.5-3.0 focus level
    const avgFocus = avgFocusValue < 2 ? "low" : avgFocusValue < 2.5 ? "medium" : "high";

    sampleSummaries.push({
      id: summaryId++,
      week: 47 - weekOffset,
      year: 2024,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      weekRange: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
      stats: {
        totalTasks,
        totalHours,
        avgFocus
      },
      summary: template.summary,
      insights: template.insights,
      recommendations: template.recommendations,
      timestamp: weekEnd.toISOString()
    });
  }

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