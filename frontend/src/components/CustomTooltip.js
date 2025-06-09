import React from 'react';
import { useTheme } from 'styled-components';

/**
 * Custom tooltip component for charts
 * @param {Object} props - Component props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Chart data payload
 * @param {string} props.label - Chart label
 * @param {string} props.className - Additional CSS classes
 */
function CustomTooltip({ active, payload, label, className = "" }) {
  const theme = useTheme();
  
  // Provide fallback theme values if theme is undefined
  const fallbackTheme = {
    colors: {
      surface: '#ffffff',
      border: '#e2e8f0',
      text: {
        primary: '#1e293b'
      }
    },
    borderRadius: {
      medium: '8px'
    },
    shadows: {
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  };

  const currentTheme = theme || fallbackTheme;

  if (active && payload && payload.length) {
    return (
      <div 
        className={className}
        style={{
          background: currentTheme.colors?.surface || fallbackTheme.colors.surface,
          border: `1px solid ${currentTheme.colors?.border || fallbackTheme.colors.border}`,
          borderRadius: currentTheme.borderRadius?.medium || fallbackTheme.borderRadius.medium,
          padding: '12px',
          boxShadow: currentTheme.shadows?.medium || fallbackTheme.shadows.medium,
          color: currentTheme.colors?.text?.primary || fallbackTheme.colors.text.primary
        }}
      >
        <p style={{ marginBottom: '8px', fontWeight: '600' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default CustomTooltip; 