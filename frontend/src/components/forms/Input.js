import styled from 'styled-components';

/**
 * Input component
 */
const Input = styled.input.attrs(props => ({
  className: `
    px-4 py-3 border border-border rounded-lg bg-background text-text-primary 
    text-sm transition-all duration-200 focus:border-primary focus:outline-none
    focus:shadow-[0_0_0_3px_rgb(var(--color-primary)/0.2)] placeholder:text-text-muted
    ${props.$theme === 'Tron' ? 'bg-surface border-border text-text-primary font-mono focus:glow-sm' : ''}
  `
}))``;

export default Input; 