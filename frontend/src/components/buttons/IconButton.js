import styled from 'styled-components';

/**
 * Icon button component
 */
const IconButton = styled.button.attrs(props => ({
  className: `
    p-2 border-none rounded bg-transparent text-text-muted transition-all duration-200 
    cursor-pointer hover:bg-background-hover hover:text-text-secondary hover:scale-110
    ${props.$theme === 'Tron' ? 'hover:text-primary hover:text-glow' : ''}
  `
}))`
  svg {
    width: 16px;
    height: 16px;
  }
`;

export default IconButton; 