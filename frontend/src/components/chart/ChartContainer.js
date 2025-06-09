import styled from 'styled-components';

/**
 * Chart container with responsive sizing
 */
const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
  
  .recharts-tooltip-wrapper {
    .recharts-default-tooltip {
      background: ${props => props.theme.colors.surface} !important;
      border: 1px solid ${props => props.theme.colors.border} !important;
      border-radius: ${props => props.theme.borderRadius.medium} !important;
      box-shadow: ${props => props.theme.shadows.medium} !important;
      color: ${props => props.theme.colors.text.primary} !important;
      
      ${props => props.theme.name === 'tron' && `
        background: ${props.theme.colors.surface} !important;
        border: 1px solid ${props.theme.colors.primary} !important;
        box-shadow: ${props.theme.glow.small} !important;
      `}
    }
  }
`;

export default ChartContainer; 