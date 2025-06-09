import React from "react";
import styled from "styled-components";

/**
 * Summary week range title with conditional theming
 */
const StyledSummaryWeekRange = styled.h3.attrs(() => ({
  className: "text-lg font-semibold m-0",
}))`
  color: ${(props) => props.theme.colors.text.primary};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    color: ${props.theme.colors.primary};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Component for displaying week range title with theme-aware styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display
 */
function SummaryWeekRange({ children, ...props }) {
  return (
    <StyledSummaryWeekRange {...props}>
      {children}
    </StyledSummaryWeekRange>
  );
}

export default SummaryWeekRange; 