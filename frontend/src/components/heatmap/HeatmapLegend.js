import styled from 'styled-components';

/**
 * Heatmap legend container
 */
const HeatmapLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
  flex-wrap: wrap;
`;

/**
 * Legend item component
 */
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

/**
 * Legend color box component
 */
const LegendColorBox = styled.div`
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.color};
`;

/**
 * Generate legend data for heatmap
 * @param {Object} theme - Theme object
 * @returns {Array} Array of legend items with labels and colors
 */
export const generateLegendData = (theme) => {
  const baseColor = theme?.colors?.primary || '#6366f1';
  const surfaceColor = theme?.colors?.surface || '#ffffff';
  
  return [
    { label: 'No data', color: surfaceColor },
    { label: 'Low', color: `${baseColor}40` },
    { label: 'Medium', color: `${baseColor}80` },
    { label: 'High', color: baseColor }
  ];
};

export { LegendItem, LegendColorBox };
export default HeatmapLegend; 