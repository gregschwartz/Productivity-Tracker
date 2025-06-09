import styled from 'styled-components';

/**
 * Time range selector container
 */
const TimeRangeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  border: 2px solid ${props => props.theme.colors.primary};
  position: sticky;
  top: 10px;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  ${props => props.theme.name === 'tron' && `
    border: 2px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.medium};
    background: ${props.theme.colors.surface}ee;
  `}
`;

export default TimeRangeSelector; 