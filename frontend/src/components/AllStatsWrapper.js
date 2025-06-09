import styled from 'styled-components';

/**
 * All stats wrapper component
 */
const AllStatsWrapper = styled.div`
  margin-bottom: 32px;
  
  @media (min-width: 1200px) {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 16px;
    
    > div:first-child {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    > div:last-child {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
  }
`;

export default AllStatsWrapper; 