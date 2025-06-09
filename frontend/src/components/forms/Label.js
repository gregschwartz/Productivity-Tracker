import styled from 'styled-components';

/**
 * Label component
 */
const Label = styled.label.attrs(props => ({
  className: `
    text-sm font-medium text-text-secondary
    ${props.$theme === 'Tron' ? 'text-primary uppercase tracking-wide text-xs' : ''}
  `
}))``;

export default Label; 