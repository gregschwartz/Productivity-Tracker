import styled from 'styled-components';

/**
 * Main container for task management
 */
export const TaskContainer = styled.div.attrs({
  className: 'grid gap-6 grid-cols-1 max-w-3xl mx-auto'
})``;

/**
 * Date filter banner
 */
export const DateNavigation = styled.div.attrs(props => ({
  className: `
    rounded-xl p-5 shadow-theme-lg mb-6 relative
    bg-gradient-to-br from-primary/5 to-primary/20 border-2
    ${props.$theme === 'Tron' ? 'border-primary bg-surface' : 'border-primary/30'}
  `
}))`
  ${props => props.$theme === 'Tron' && `
    box-shadow: var(--shadow-medium);
  `}
`;

/**
 * Date navigation header
 */
export const DateNavHeader = styled.div.attrs({
  className: 'flex justify-between items-center mb-4'
})``;

/**
 * Current date display
 */
export const CurrentDateDisplay = styled.h2.attrs(props => ({
  className: `
    text-xl font-semibold text-text-primary m-0
    ${props.$theme === 'Tron' ? 'text-primary font-mono uppercase tracking-wide' : ''}
  `
}))``;

/**
 * Date navigation controls
 */
export const DateNavControls = styled.div.attrs({
  className: 'flex gap-3 items-center md:flex-row flex-col md:gap-3 gap-2 md:items-center items-stretch'
})``;

/**
 * Date navigation buttons
 */
export const DateNavButtons = styled.div.attrs({
  className: 'flex gap-2'
})``;

/**
 * Add task section styled component
 */
export const AddTaskSection = styled.div.attrs(props => ({
  className: `
    bg-surface rounded-xl p-7 shadow-theme-lg mb-6 border-2 border-dashed 
    border-border transition-all duration-200 hover:border-primary/60
    ${props.$theme === 'Tron' ? 'border-primary/60 hover:border-primary hover:shadow-theme-md' : ''}
  `
}))``;

/**
 * Task form styled component
 */
export const TaskForm = styled.form.attrs({
  className: 'grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto] items-end'
})``;

/**
 * Form fields container
 */
export const FormFields = styled.div.attrs({
  className: 'grid gap-4 grid-cols-1 md:grid-cols-[2fr_1fr_1fr]'
})``;

/**
 * Task list styled component
 */
export const TaskList = styled.div.attrs({
  className: 'flex flex-col gap-3'
})``;

/**
 * Task header styled component
 */
export const TaskHeader = styled.div.attrs({
  className: 'flex justify-between items-start gap-4 mb-3'
})``;

/**
 * Task title styled component
 */
export const TaskTitle = styled.h3.attrs(props => ({
  className: `
    text-base font-semibold text-text-primary flex-1 m-0
    ${props.$theme === 'Tron' ? 'text-primary font-mono' : ''}
  `
}))``;

/**
 * Task actions styled component
 */
export const TaskActions = styled.div.attrs({
  className: 'flex gap-2'
})``;

/**
 * Task meta information styled component
 */
export const TaskMeta = styled.div.attrs({
  className: 'flex gap-4 items-center flex-wrap'
})``;