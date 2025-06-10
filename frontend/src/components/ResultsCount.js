import styled from 'styled-components';

/**
 * Results count display component
 */
const ResultsCount = styled.div.attrs(() => ({
  className: 'text-sm m-0'
}))`
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    color: ${props.theme.colors.text.muted};
  `}
`;

export default ResultsCount; 