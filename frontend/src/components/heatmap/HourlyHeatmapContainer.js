import styled from 'styled-components';

/**
 * Hourly heatmap container component
 */
const HourlyHeatmapContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin-top: 16px;
  max-width: 600px;
`;

export default HourlyHeatmapContainer; 