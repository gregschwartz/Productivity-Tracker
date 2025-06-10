import styled from 'styled-components';

/**
 * Container for all visualizations
 */
export const VisualizationContainer = styled.div`
  display: grid;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

/**
 * Overview stats row (Total and Average)
 */
export const OverviewStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  
  @media (min-width: 1200px) {
    margin-bottom: 0;
  }
`;

/**
 * Focus stats row for focus-level specific metrics
 */
export const FocusStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;