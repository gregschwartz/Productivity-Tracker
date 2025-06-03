import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, TrendingUp, Clock, Focus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Container for search functionality
 */
const SearchContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * Search input section
 */
const SearchSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 24px;
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.medium};
  `}
`;

/**
 * Search input container
 */
const SearchInputContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

/**
 * Search input field
 */
const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 48px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 16px;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    border: 2px solid ${props.theme.colors.border};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
    outline: none;
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
      border-color: ${props.theme.colors.primary};
    `}
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

/**
 * Search icon in input
 */
const SearchIcon = styled(Search)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: ${props => props.theme.colors.text.muted};
  pointer-events: none;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
  `}
`;

/**
 * Suggestion chips container
 */
const SuggestionChips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

/**
 * Individual suggestion chip
 */
const SuggestionChip = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  background: transparent;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
  `}

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primaryText};
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.glow.small};
    `}
  }
`;

/**
 * Search results container
 */
const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Results header
 */
const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
`;

/**
 * Results count
 */
const ResultsCount = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    font-family: ${props.theme.fonts.mono};
    color: ${props.theme.colors.text.muted};
  `}
`;

/**
 * Sort dropdown
 */
const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
  cursor: pointer;
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.border};
    color: ${props.theme.colors.text.primary};
    font-family: ${props.theme.fonts.mono};
  `}

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

/**
 * Search result card
 */
const ResultCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 20px;
  box-shadow: ${props => props.theme.shadows.small};
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'tron' && `
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${props.theme.shadows.small};
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    ${props => props.theme.name === 'tron' && `
      box-shadow: ${props.theme.shadows.medium};
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Result card header
 */
const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

/**
 * Result title
 */
const ResultTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  
  ${props => props.theme.name === 'tron' && `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Result relevance score
 */
const RelevanceScore = styled.div`
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.small};
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.theme.name === 'tron' && `
    background: ${props.theme.colors.primary}30;
    border: 1px solid ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Result meta information
 */
const ResultMeta = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

/**
 * Meta item
 */
const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
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
const ResultSnippet = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  
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
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
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
      const text = `${summary.summary} ${summary.insights.join(' ')} ${summary.recommendations.join(' ')}`.toLowerCase();
      
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
      let snippet = summary.summary;
      matches.forEach(match => {
        const regex = new RegExp(`\\b${match}\\b`, 'gi');
        snippet = snippet.replace(regex, `<mark>$&</mark>`);
      });
      
      return {
        ...summary,
        relevanceScore: score,
        highlightedSnippet: snippet
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
                      <Calendar />
                      {format(new Date(result.timestamp), 'MMM dd, yyyy')}
                    </MetaItem>
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
                      {result.stats.avgFocus}/3 focus
                    </MetaItem>
                  </ResultMeta>

                  <ResultSnippet
                    dangerouslySetInnerHTML={{
                      __html: result.highlightedSnippet || result.summary
                    }}
                  />
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