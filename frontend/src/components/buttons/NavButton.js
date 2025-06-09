import styled from 'styled-components';

/**
 * Navigation button component
 */
const NavButton = styled.button.attrs(props => ({
  className: `
    flex items-center justify-center gap-1.5 px-4 py-2.5 bg-transparent
    border border-border rounded-lg text-text-secondary text-sm font-medium
    transition-all duration-200 cursor-pointer hover:bg-background-hover 
    hover:border-primary hover:text-primary hover:-translate-y-0.5
    ${props.$theme === 'Tron' ? 'border-primary text-text-primary font-mono uppercase tracking-wide hover:glow-sm' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }
`;

export default NavButton; 