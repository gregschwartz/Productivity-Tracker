import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  Settings,
  Key,
  Database,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

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
 * Form group for inputs
 */
const FormGroup = styled.div.attrs(() => ({
  className: 'mb-5'
}))``;

/**
 * Form label
 */
const Label = styled.label.attrs(() => ({
  className: 'block text-sm font-medium mb-2'
}))`
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 12px;
  `}
`;

/**
 * Input field
 */
const Input = styled.input.attrs(() => ({
  className: 'w-full px-4 py-3 border rounded-lg text-sm transition-all duration-200 outline-none'
}))`
  background: ${props => props.theme.colors.background};
  border-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.primary};
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

/**
 * Button styles
 */
const Button = styled.button.attrs(props => ({
  className: `flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`
}))`
  border-color: ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? props.theme.colors.primaryText : props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && props.variant === 'primary' && `
    box-shadow: ${props.theme.glow.small};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover:not(:disabled) {
    background: ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    
    ${props => props.theme.name === 'tron' && props.variant === 'primary' && `
      box-shadow: ${props.theme.glow.medium};
    `}
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Status indicator
 */
const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    const colors = {
      success: props.theme.colors.status.success,
      warning: props.theme.colors.status.warning,
      error: props.theme.colors.status.error,
      info: props.theme.colors.status.info
    };
    
    const bgColor = colors[props.status] || colors.info;
    
    return `
      background: ${bgColor}20;
      color: ${bgColor};
      border: 1px solid ${bgColor}40;
      
      ${props.theme.name === 'tron' && `
        box-shadow: 0 0 8px ${bgColor}30;
        font-family: ${props.theme.fonts.mono};
        text-transform: uppercase;
        letter-spacing: 1px;
      `}
    `;
  }}

  svg {
    width: 16px;
    height: 16px;
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
 * Service list
 */
const ServiceList = styled.div.attrs(() => ({
  className: 'flex flex-col gap-3'
}))``;

/**
 * Service item
 */
const ServiceItem = styled.div.attrs(() => ({
  className: 'flex justify-between items-center px-4 py-3 border rounded-lg'
}))`
  background: ${props => props.theme.colors.backgroundHover};
  border-color: ${props => props.theme.colors.border};
`;

/**
 * Service info
 */
const ServiceInfo = styled.div.attrs(() => ({
  className: 'flex flex-col gap-1'
}))``;

/**
 * Service name
 */
const ServiceName = styled.div.attrs(() => ({
  className: 'font-semibold'
}))`
  color: ${props => props.theme.colors.text.primary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    color: ${props.theme.colors.primary};
  `}
`;

/**
 * Service description
 */
const ServiceDescription = styled.div.attrs(() => ({
  className: 'text-xs'
}))`
  color: ${props => props.theme.colors.text.muted};
`;

/**
 * AdminDashboard component for system configuration and monitoring
 */
function AdminDashboard({ tasks, summaries }) {

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      fetch('/api/clear-data', {
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