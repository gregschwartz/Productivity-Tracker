import React from 'react';
import styled from 'styled-components';

/**
 * Suggestion chips container
 */
const SuggestionChipsContainer = styled.div.attrs(() => ({
  className: 'flex gap-2 flex-wrap'
}))``;

/**
 * Individual suggestion chip
 */
const SuggestionChip = styled.button.attrs(() => ({
  className: 'px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 cursor-pointer hover:-translate-y-px'
}))`
  background: transparent;
  border-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primaryText};
    border-color: ${props => props.theme.colors.primary};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
  }
`;

/**
 * Reusable SuggestionChips component
 * @param {Object} props - Component props
 * @param {Array<string>} props.suggestions - Array of suggestion strings
 * @param {function} props.onSuggestionClick - Callback when a suggestion is clicked
 * @param {string} props.className - Additional CSS classes
 */
function SuggestionChips({ suggestions = [], onSuggestionClick = () => {}, className = "" }) {
  if (!suggestions.length) return null;

  return (
    <SuggestionChipsContainer className={className}>
      {suggestions.map((suggestion, index) => (
        <SuggestionChip
          key={`${suggestion}-${index}`}
          onClick={() => onSuggestionClick(suggestion)}
          type="button"
        >
          {suggestion}
        </SuggestionChip>
      ))}
    </SuggestionChipsContainer>
  );
}

export default SuggestionChips; 