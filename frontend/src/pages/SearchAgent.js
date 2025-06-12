import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SearchInput from '../components/forms/SearchInput';
import SuggestionChips from '../components/SuggestionChips';
import EmptyState from '../components/EmptyState';
import SearchResultCard from '../components/SearchResultCard';
import ResultsCount from '../components/ResultsCount';
import SortSelect from '../components/SortSelect';
import { getApiUrl } from '../utils/api';
import { SearchProgressBar } from '../components/loading';

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
 * Format week range for display
 */
const formatWeekRange = (weekStart, weekEnd) => {
  if (!weekStart) return 'Unknown Week';
  
  const start = new Date(weekStart);
  const end = weekEnd ? new Date(weekEnd) : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  const options = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  }
  
  return `${startStr} - ${endStr}`;
};


/**
 * SearchAgent component for searching historical productivity summaries
 */
function SearchAgent({ summaries = [] }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);


  /**
   * Perform backend search when query changes
   */
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setSearchError(null);
      
      const timeoutId = setTimeout(() => {
        setSearchError('Search timed out after 30 seconds. Please try again.');
        setSearchResults([]);
        setIsSearching(false);
      }, 30000);
      
      try {
        const apiUrl = getApiUrl();
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`${apiUrl}/summaries/search?query=${encodedQuery}`);
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }
        
        const results = await response.json();
        
        // Transform backend results to match frontend expectations
        const transformedResults = results.map((result) => ({
          ...result,
          summary: result.summary,
          recommendations: result.recommendations || [],
          weekRange: formatWeekRange(result.week_start, result.week_end),
          stats: {
            totalTasks: result.stats?.total_tasks || 0,
            totalHours: result.stats?.total_hours || '0',
            avgFocus: result.stats?.avg_focus || 'medium'
          }
        }));
        
        setSearchResults(transformedResults);
      } catch (error) {
        clearTimeout(timeoutId);
        setSearchError('Error performing search. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  /**
   * Sort search results based on selected sort option
   */
  const sortedResults = React.useMemo(() => {
    if (searchResults.length === 0) return searchResults;

    return [...searchResults].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.week_start || b.timestamp) - new Date(a.week_start || a.timestamp);
        case 'tasks':
          return (b.stats?.total_tasks || b.stats?.totalTasks || 0) - (a.stats?.total_tasks || a.stats?.totalTasks || 0);
        case 'hours':
          const bHours = parseFloat(b.stats?.total_hours || b.stats?.totalHours || 0);
          const aHours = parseFloat(a.stats?.total_hours || a.stats?.totalHours || 0);
          return bHours - aHours;
        default: // date (fallback)
          return new Date(b.week_start || b.timestamp) - new Date(a.week_start || a.timestamp);
      }
    });
  }, [searchResults, sortBy]);

  /**
   * Handle suggestion chip click
   */
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  const suggestions = [
    'frontend',
    'meetings',
    'testing',
    'security',
    'AI',
    'documentation',
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
        <SearchResults data-testid="search-results">
          {isSearching ? (
            <SearchProgressBar />
          ) : !searchError && (
            <ResultsHeader>
              <ResultsCount>{`${sortedResults.length} results found`}</ResultsCount>
              <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Sort by Date</option>
                <option value="tasks">Sort by Tasks</option>
                <option value="hours">Sort by Hours</option>
              </SortSelect>
            </ResultsHeader>
          )}

          <AnimatePresence>
            {searchError ? (
              <EmptyState
                title="Search Error"
                description={searchError}
              />
            ) : searchResults.length === 0 && !isSearching ? (
              <EmptyState
                title="No matching weeks found"
                description="Try different keywords or check your spelling."
              />
            ) : (
              sortedResults.map((result, index) => (
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