import styled from 'styled-components';

/**
 * Time range button component
 */
const TimeRangeButton = styled.button`
  padding: 8px 16px;
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? props.theme.colors.primaryText : props.theme.colors.text.primary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
    ${props.$active ? `
      box-shadow: ${props.theme.glow.small};
      border-color: ${props.theme.colors.primary};
    ` : ''}
  `}

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.backgroundHover};
    
    ${props => props.theme.name === 'tron' && !props.$active && `
      border-color: ${props.theme.colors.primary};
    `}
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default TimeRangeButton; 