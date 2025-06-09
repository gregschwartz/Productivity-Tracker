import styled from 'styled-components';

/**
 * Secondary button for cancel actions
 */
const SecondaryButton = styled.button.attrs(props => ({
  className: `
    flex items-center gap-2 px-6 py-3 bg-transparent text-text-secondary 
    border border-border rounded-lg font-medium text-sm transition-all duration-200 
    cursor-pointer hover:bg-background-hover hover:border-primary hover:text-primary 
    hover:-translate-y-0.5 focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary)]
    ${props.$theme === 'Tron' ? 'border-border text-text-primary uppercase tracking-wide font-mono hover:glow-sm' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
`;

export default SecondaryButton; 