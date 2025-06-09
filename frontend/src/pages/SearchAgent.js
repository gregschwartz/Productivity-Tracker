import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import SearchInput from '../components/SearchInput';
import SuggestionChips from '../components/SuggestionChips';
import EmptyState from '../components/EmptyState';
import SearchResultCard from '../components/SearchResultCard';
import ResultsCount from '../components/ResultsCount';
import SortSelect from '../components/SortSelect';
import { getApiUrl } from '../utils/api';

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
  const [searchResults, setSearchResults] = useState([]);


  /**
   * Perform backend search when query changes
   */
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      
      try {
        const apiUrl = getApiUrl();
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`${apiUrl}/summaries/?query=${encodedQuery}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }
        
        const results = await response.json();
        
        // Transform backend results to match frontend expectations
        const transformedResults = results.map((result, index) => ({
          ...result,
          relevanceScore: results.length - index, // Higher score for earlier results
          highlightedSummary: result.summary,
          highlightedRecommendations: result.recommendations || []
        }));
        
        // Sort results based on selected sort option
        const sortedResults = [...transformedResults].sort((a, b) => {
          switch (sortBy) {
            case 'date':
              return new Date(b.week_start || b.timestamp) - new Date(a.week_start || a.timestamp);
            case 'tasks':
              return (b.stats?.total_tasks || b.stats?.totalTasks || 0) - (a.stats?.total_tasks || a.stats?.totalTasks || 0);
            case 'hours':
              const bHours = parseFloat(b.stats?.total_hours || b.stats?.totalHours || 0);
              const aHours = parseFloat(a.stats?.total_hours || a.stats?.totalHours || 0);
              return bHours - aHours;
            default: // relevance
              return b.relevanceScore - a.relevanceScore;
          }
        });
        
        setSearchResults(sortedResults);
      } catch (error) {
        console.error('Error performing search:', error);
        // Fallback to local search if backend fails
        const fallbackResults = performSemanticSearch(query, summaries);
        setSearchResults(fallbackResults);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
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
        <SearchInput
          placeholder="Search productivity patterns... (e.g., 'coding tasks with high focus')"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <SuggestionChips
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
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
              <EmptyState
                title="No matching weeks found"
                description="Try different keywords or check your spelling."
              />
            ) : (
              searchResults.map((result, index) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  index={index}
                />
              ))
            )}
          </AnimatePresence>
        </SearchResults>
      )}

      {!query.trim() && (
        <EmptyState
          title="Search Your Productivity History"
          description="Enter keywords to find weeks with similar productivity patterns and insights."
          icon={<Sparkles />}
        />
      )}
    </SearchContainer>
  );
}

export default SearchAgent; 