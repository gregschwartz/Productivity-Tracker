import styled from 'styled-components';

/**
 * Time range selector container
 */
const TimeRangeSelector = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  border: 1px solid ${props => props.theme.colors.border};
  max-width: calc(min(100%, 500px));
  margin: 0 auto;
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    background: ${props.theme.colors.surface};
  `}
`;

export default TimeRangeSelector; 