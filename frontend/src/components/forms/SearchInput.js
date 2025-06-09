import React from 'react';
import styled from 'styled-components';
import { Search } from 'lucide-react';

/**
 * Search input container
 */
const SearchInputContainer = styled.div.attrs(() => ({
  className: 'relative mb-4'
}))``;

/**
 * Search input field
 */
const SearchInputField = styled.input.attrs(() => ({
  className: 'w-full pl-12 pr-5 py-4 border-2 rounded-lg text-base transition-all duration-200 outline-none'
}))`
  background: ${props => props.theme.colors.background};
  border-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.primary};
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

/**
 * Search icon in input
 */
const SearchIcon = styled(Search).attrs(() => ({
  className: 'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none'
}))`
  color: ${props => props.theme.colors.text.muted};
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
  `}
`;

/**
 * Reusable SearchInput component
 * @param {Object} props - Component props
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.autoFocus - Whether to auto focus
 * @param {string} props.className - Additional CSS classes
 */
function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  autoFocus = false,
  className = "",
  ...props 
}) {
  return (
    <SearchInputContainer className={className}>
      <SearchIcon />
      <SearchInputField
        type="text"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        {...props}
      />
    </SearchInputContainer>
  );
}

export default SearchInput; 