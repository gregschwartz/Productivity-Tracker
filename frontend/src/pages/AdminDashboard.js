import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Database,
  Activity,
  Trash2
} from 'lucide-react';
import Button from './Button';

/**
 * Container for admin dashboard
 */
const AdminContainer = styled.div.attrs(() => ({
  className: 'max-w-4xl mx-auto grid gap-6 grid-cols-1'
}))``;

/**
 * Dashboard section card
 */
const DashboardSection = styled(motion.div).attrs(() => ({
  className: 'p-6 rounded-xl shadow-lg border'
}))`
  background: ${props => props.theme.colors.surface};
  border-color: ${props => props.theme.colors.border};
`;

/**
 * Section header
 */
const SectionHeader = styled.div.attrs(() => ({
  className: 'flex items-center gap-3 mb-5 pb-3 border-b'
}))`
  border-color: ${props => props.theme.colors.border};
`;

/**
 * Section title
 */
const SectionTitle = styled.h2.attrs(() => ({
  className: 'text-lg font-semibold m-0'
}))`
  color: ${props => props.theme.colors.text.primary};
  
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
 * Metrics grid
 */
const MetricsGrid = styled.div.attrs(() => ({
  className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5'
}))``;

/**
 * Metric card
 */
const MetricCard = styled.div.attrs(() => ({
  className: 'p-4 border rounded-lg text-center'
}))`
  background: ${props => props.theme.colors.backgroundHover};
  border-color: ${props => props.theme.colors.border};
`;

/**
 * Metric value
 */
const MetricValue = styled.div.attrs(() => ({
  className: 'text-2xl font-bold mb-1'
}))`
  color: ${props => props.theme.colors.primary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-shadow: ${props.theme.glow.small};
  `}
`;

/**
 * Metric label
 */
const MetricLabel = styled.div.attrs(() => ({
  className: 'text-xs font-medium'
}))`
  color: ${props => props.theme.colors.text.muted};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
`;

/**
 * AdminDashboard component for system configuration and monitoring
 */
function AdminDashboard({ tasks, summaries }) {

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      fetch('http://localhost:8000/api/admin/generate-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      window.location.reload();
    }
  };

  return (
    <AdminContainer>
      {/* System Overview */}
      <DashboardSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader>
          <Activity />
          <SectionTitle>System Overview</SectionTitle>
        </SectionHeader>
        
        <MetricsGrid>
          <MetricCard>
            <MetricValue>{tasks.length}</MetricValue>
            <MetricLabel>Total Tasks</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{summaries.length}</MetricValue>
            <MetricLabel>AI Summaries</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{(tasks.reduce((sum, task) => sum + task.timeSpent, 0)).toFixed(1)}h</MetricValue>
            <MetricLabel>Total Hours</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </DashboardSection>

      {/* Data Management */}
      <DashboardSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <SectionHeader>
          <Database />
          <SectionTitle>Data Management</SectionTitle>
        </SectionHeader>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          <Button onClick={handleClearData}>
            <Trash2 />
            Reset Data to Initial State
          </Button>
        </div>

      </DashboardSection>
    </AdminContainer>
  );
}

export default AdminDashboard; 