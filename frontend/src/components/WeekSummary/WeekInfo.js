import React from "react";
import styled from "styled-components";

/**
 * Week info display with conditional theming
 */
const StyledWeekInfo = styled.div.attrs(() => ({
  className: "text-sm",
}))`
  color: ${(props) => props.theme.colors.text.secondary};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    background: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.border};
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Component for displaying week information with theme-aware styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display
 */
function WeekInfo({ children, ...props }) {
  return (
    <StyledWeekInfo {...props}>
      {children}
    </StyledWeekInfo>
  );
}

export default WeekInfo; 