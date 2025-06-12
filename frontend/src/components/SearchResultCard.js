import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Focus } from 'lucide-react';
import MetaItem from './MetaItem';

/**
 * Search result card
 */
const ResultCard = styled(motion.div).attrs(() => ({
  className: 'p-5 border rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
}))`
  background: ${props => props.theme.colors.surface};
  border-color: ${props => props.theme.colors.border};
  
  &:hover {
    ${props => props.theme.name === 'tron' && `
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Result card header
 */
const ResultHeader = styled.div.attrs(() => ({
  className: 'flex justify-between items-start mb-3'
}))``;

/**
 * Result title
 */
const ResultTitle = styled.h3.attrs(() => ({
  className: 'text-base font-semibold m-0'
}))`
  color: ${props => props.theme.colors.text.primary};
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;


/**
 * Result meta information
 */
const ResultMeta = styled.div.attrs(() => ({
  className: 'flex gap-4 items-center mb-3 flex-wrap'
}))``;



/**
 * Result snippet with highlighted keywords
 */
const SummaryResultSnippet = styled.p.attrs(() => ({
  className: 'text-sm leading-relaxed m-0'
}))`
  color: ${props => props.theme.colors.text.secondary};
  
  mark {
    background: ${props => props.theme.colors.primary}30;
    color: ${props => props.theme.colors.text.primary};
    padding: 2px 4px;
    border-radius: 2px;
    
    ${props => props.theme.name === 'tron' && `
      background: ${props.theme.colors.primary}40;
      box-shadow: 0 0 4px ${props.theme.colors.primary}60;
    `}
  }
`;

/**
 * Recommendation snippet
 */
const SummaryRecommendationSnippet = styled.li.attrs(() => ({
  className: 'text-sm leading-relaxed m-0 list-disc list-inside'
}))`
  color: ${props => props.theme.colors.text.secondary};

  mark {
    background: ${props => props.theme.colors.primary}30;
    color: ${props => props.theme.colors.text.primary};
    padding: 2px 4px;
    border-radius: 2px;
    
    ${props => props.theme.name === 'tron' && `
      background: ${props.theme.colors.primary}40;
      box-shadow: 0 0 4px ${props.theme.colors.primary}60;
    `}
  }
`;

/**
 * Reusable SearchResultCard component
 * @param {Object} props - Component props
 * @param {Object} props.result - Search result data
 * @param {number} props.index - Index for animation delay
 * @param {string} props.className - Additional CSS classes
 */
function SearchResultCard({ result, index = 0, className = "" }) {
  return (
    <ResultCard
      key={result.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={className}
    >
      <ResultHeader>
        <ResultTitle>{result.weekRange}</ResultTitle>
        <ResultMeta>
          <MetaItem size="xs" gap="1" $iconSize="12px">
            <TrendingUp />
            {result.stats.totalTasks} tasks
          </MetaItem>
          <MetaItem size="xs" gap="1" $iconSize="12px">
            <Clock />
            {result.stats.totalHours}h total
          </MetaItem>
          <MetaItem size="xs" gap="1" $iconSize="12px">
            <Focus />
            {result.stats.avgFocus} focus
          </MetaItem>
        </ResultMeta>
      </ResultHeader>

      <SummaryResultSnippet
        dangerouslySetInnerHTML={{
          __html: result.summary
        }}
      />

      <ul>
        {result.recommendations.map((recommendation, index) => (
          <SummaryRecommendationSnippet
            key={index}
            dangerouslySetInnerHTML={{
              __html: recommendation
            }}
          />
        ))}
      </ul>
    </ResultCard>
  );
}

export default SearchResultCard; 