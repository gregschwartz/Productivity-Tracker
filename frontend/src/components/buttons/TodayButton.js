import styled from 'styled-components';
import NavButton from './NavButton';

/**
 * Today button component
 */
const TodayButton = styled(NavButton).attrs(props => ({
  className: `
    ${props.$isToday ? 'bg-primary text-primary-text border-primary' : 'bg-transparent text-text-secondary'}
    border-primary hover:bg-primary hover:text-primary-text
    ${props.$theme === 'Tron' && props.$isToday ? 'glow-sm' : ''}
  `
}))``;

export default TodayButton; 