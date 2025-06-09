import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

/**
 * Summary card styled component as a motion.div with hover effects
 */
const StyledSummaryCard = styled(motion.div).attrs(() => ({
  className:
    "p-6 border rounded-xl shadow-sm transition-all duration-200 w-full max-w-full md:w-[95%] md:mx-auto lg:w-[90%] hover:-translate-y-0.5 hover:shadow-lg",
}))`
  background: ${(props) => props.theme.colors.surface};
  border-color: ${(props) => props.theme.colors.border};

  &:hover {
    ${(props) =>
      props.theme.name === "tron" &&
      `
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

/**
 * Reusable card component for summary content with animation and hover effects
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render inside the card
 * @param {Object} props.animate - Animation properties for framer-motion
 * @param {Object} props.initial - Initial animation state
 * @param {Object} props.transition - Animation transition properties
 */
function SummaryCard({ 
  children, 
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.2 },
  ...props 
}) {
  return (
    <StyledSummaryCard
      initial={initial}
      animate={animate}
      transition={transition}
      {...props}
    >
      {children}
    </StyledSummaryCard>
  );
}

export default SummaryCard; 