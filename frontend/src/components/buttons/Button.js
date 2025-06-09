import styled from 'styled-components';

/**
 * Reusable Button component
 */
const Button = styled.button.attrs(props => ({
  className: `
    flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium 
    transition-all duration-200 cursor-pointer hover:-translate-y-px 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${props.$variant === 'primary' 
      ? 'bg-primary text-primary-text border-primary' 
      : 'bg-transparent text-text-secondary border-border hover:bg-background-hover'
    }
    ${props.$theme === 'Tron' && props.$variant === 'primary' ? 'glow-sm font-mono uppercase tracking-wide' : ''}
  `
}))`
  ${props => props.$theme === 'Tron' && props.$variant === 'primary' && `
    box-shadow: ${props.theme.glow?.small || '0 0 10px rgba(99, 102, 241, 0.3)'};
    
    &:hover:not(:disabled) {
      box-shadow: ${props.theme.glow?.medium || '0 0 20px rgba(99, 102, 241, 0.5)'};
    }
  `}

  svg {
    width: 16px;
    height: 16px;
  }
`;

export default Button; 