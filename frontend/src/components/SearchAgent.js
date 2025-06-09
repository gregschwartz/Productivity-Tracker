import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, TrendingUp, Clock, Focus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Container for search functionality
 */
const SearchContainer = styled.div.attrs(() => ({
  className: 'max-w-4xl mx-auto flex flex-col gap-6'
}))``;

/**
 * Search input section
 */
const SearchSection = styled.div.attrs(() => ({
  className: 'p-6 rounded-xl shadow-lg border'
}))`
  background: ${props => props.theme.colors.surface};
  border-color: ${props => props.theme.colors.border};
`;

/**
 * Search input container
 */
const SearchInputContainer = styled.div.attrs(() => ({
  className: 'relative mb-4'
}))``;

/**
 * Search input field
 */
const SearchInput = styled.input.attrs(() => ({
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
 * Suggestion chips container
 */
const SuggestionChips = styled.div.attrs(() => ({
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
`;

/**
 * Search results container
 */
const SearchResults = styled.div.attrs(() => ({
  className: 'flex flex-col gap-4'
}))``;

/**
 * Results header
 */
const ResultsHeader = styled.div.attrs(() => ({
  className: 'flex justify-between items-center px-1'
}))``;

/**
 * Results count
 */
const ResultsCount = styled.p.attrs(() => ({
  className: 'text-sm m-0'
}))`
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    color: ${props.theme.colors.text.muted};
  `}
`;

/**
 * Sort dropdown
 */
const SortSelect = styled.select.attrs(() => ({
  className: 'px-3 py-2 border rounded text-xs cursor-pointer outline-none'
}))`
  background: ${props => props.theme.colors.background};
  border-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

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
 * Result relevance score
 */
const RelevanceScore = styled.div.attrs(() => ({
  className: 'px-2 py-1 rounded text-xs font-medium'
}))`
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.primary}30;
    border: 1px solid ${props.theme.colors.primary};
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
 * Meta item
 */
const MetaItem = styled.div.attrs(() => ({
  className: 'flex items-center gap-1 text-xs'
}))`
  color: ${props => props.theme.colors.text.muted};
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
  `}

  svg {
    width: 12px;
    height: 12px;
  }
`;

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
 * Empty state for no results
 */
const EmptyState = styled.div.attrs(() => ({
  className: 'text-center py-15 px-5'
}))`
  color: ${props => props.theme.colors.text.muted};
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text.secondary};
  }
  
  p {
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

/**
 * Mock semantic search function
 */
const performSemanticSearch = (query, summaries) => {
  if (!query.trim()) return [];
  
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(' ').filter(word => word.length > 2);
  
  // Expand keywords with synonyms
  const expandedKeywords = keywords.flatMap(keyword => {
    const synonyms = {
      'coding': ['programming', 'development', 'software', 'code'],
      'meeting': ['meetings', 'call', 'discussion', 'collaboration'],
      'design': ['ui', 'ux', 'interface', 'mockup', 'wireframe'],
      'testing': ['qa', 'debug', 'bug', 'test'],
      'focus': ['concentration', 'productivity', 'deep work'],
      'planning': ['strategy', 'roadmap', 'organize']
    };
    
    return [keyword, ...(synonyms[keyword] || [])];
  });
  
  return summaries
    .map(summary => {
      // Calculate relevance score based on keyword matches
      const text = `${summary.summary || ''} ${Array.isArray(summary.recommendations) ? summary.recommendations.join(' ') : ''}`.toLowerCase();
      
      let score = 0;
      let matches = [];
      
      expandedKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\w*`, 'gi');
        const keywordMatches = text.match(regex) || [];
        score += keywordMatches.length;
        matches.push(...keywordMatches);
      });
      
      if (score === 0) return null;
      
      // Create highlighted snippet
      let highlightedSummary = summary.summary;
      matches.forEach(match => {
        const regex = new RegExp(`\\b${match}\\b`, 'gi');
        highlightedSummary = highlightedSummary.replace(regex, `<mark>$&</mark>`);
      });
      // Prevent double highlighting
      highlightedSummary = highlightedSummary.replace(/<mark><mark>/g, '<mark>');
      highlightedSummary = highlightedSummary.replace(/<\/mark><\/mark>/g, '</mark>');

      let highlightedRecommendations = summary.recommendations;
      highlightedRecommendations = highlightedRecommendations.map(recommendation => {
        matches.forEach(match => {
          const regex = new RegExp(`\\b${match}\\b`, 'gi');
          recommendation = recommendation.replace(regex, `<mark>$&</mark>`);
          
          // Prevent double highlighting
          recommendation = recommendation.replace(/<mark><mark>/g, '<mark>');
          recommendation = recommendation.replace(/<\/mark><\/mark>/g, '</mark>');
        });
        return recommendation;
      });
      
      return {
        ...summary,
        relevanceScore: score,
        highlightedSummary,
        highlightedRecommendations
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * SearchAgent component for searching historical productivity summaries
 */
function SearchAgent({ summaries }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [isSearching, setIsSearching] = useState(false);


  /**
   * Perform search when query changes
   */
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    const results = performSemanticSearch(query, summaries);
    
    // Sort results
    const sortedResults = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'tasks':
          return b.stats.totalTasks - a.stats.totalTasks;
        case 'hours':
          return parseFloat(b.stats.totalHours) - parseFloat(a.stats.totalHours);
        default: // relevance
          return b.relevanceScore - a.relevanceScore;
      }
    });
    
    setTimeout(() => setIsSearching(false), 500);
    return sortedResults;
  }, [query, summaries, sortBy]);

  /**
   * Handle suggestion chip click
   */
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  const suggestions = [
    'coding tasks',
    'high focus',
    'meetings',
    'design work',
    'productive weeks',
    'low productivity'
  ];

  return (
    <SearchContainer>
      <SearchSection>
        <SearchInputContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search productivity patterns... (e.g., 'coding tasks with high focus')"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </SearchInputContainer>
        
        <SuggestionChips>
          {suggestions.map(suggestion => (
            <SuggestionChip
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </SuggestionChip>
          ))}
        </SuggestionChips>
      </SearchSection>

      {query.trim() && (
        <SearchResults>
          <ResultsHeader>
            <ResultsCount>
              {isSearching ? 'Searching...' : `${searchResults.length} results found`}
            </ResultsCount>
            <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Sort by Relevance</option>
              <option value="date">Sort by Date</option>
              <option value="tasks">Sort by Tasks</option>
              <option value="hours">Sort by Hours</option>
            </SortSelect>
          </ResultsHeader>

          <AnimatePresence>
            {searchResults.length === 0 && !isSearching ? (
              <EmptyState>
                <h3>No matching weeks found</h3>
                <p>Try different keywords or check your spelling.</p>
              </EmptyState>
            ) : (
              searchResults.map((result, index) => (
                <ResultCard
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ResultHeader>
                    <ResultTitle>{result.weekRange}</ResultTitle>
                    <RelevanceScore>
                      {Math.round((result.relevanceScore / 5) * 100)}% match
                    </RelevanceScore>
                  </ResultHeader>

                  <ResultMeta>
                    <MetaItem>
                      <TrendingUp />
                      {result.stats.totalTasks} tasks
                    </MetaItem>
                    <MetaItem>
                      <Clock />
                      {result.stats.totalHours}h total
                    </MetaItem>
                    <MetaItem>
                      <Focus />
                      {result.stats.avgFocus} focus
                    </MetaItem>
                  </ResultMeta>

                  <SummaryResultSnippet
                    dangerouslySetInnerHTML={{
                      __html: result.highlightedSummary || result.summary
                    }}
                  />

                  <ul>
                    {result.highlightedRecommendations.map((recommendation, index) => (
                      <SummaryRecommendationSnippet
                        key={index}
                        dangerouslySetInnerHTML={{
                          __html: recommendation
                        }}
                      />
                    ))}
                  </ul>
                </ResultCard>
              ))
            )}
          </AnimatePresence>
        </SearchResults>
      )}

      {!query.trim() && (
        <EmptyState>
          <Sparkles style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
          <h3>Search Your Productivity History</h3>
          <p>Enter keywords to find weeks with similar productivity patterns and insights.</p>
        </EmptyState>
      )}
    </SearchContainer>
  );
}

export default SearchAgent; 