import styled from 'styled-components';

/**
 * Sort dropdown component
 */
const SortSelect = styled.select.attrs(() => ({
  className: 'px-3 py-2 border rounded text-xs cursor-pointer outline-none'
}))`
  background: ${props => props.theme.colors.background};
  border-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' ? `
    background: ${props.theme.colors.surface};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
  ` : ''}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

export default SortSelect; 