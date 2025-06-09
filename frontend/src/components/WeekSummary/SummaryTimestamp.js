import React from "react";
import styled from "styled-components";

/**
 * Summary timestamp display with conditional theming
 */
const StyledSummaryTimestamp = styled.p.attrs(() => ({
  className: "text-xs m-0",
}))`
  color: ${(props) => props.theme.colors.text.muted};

  ${(props) =>
    props.theme.name === "tron" &&
    `
    font-family: ${props.theme.fonts.mono};
  `}
`;

/**
 * Component for displaying summary timestamp with theme-aware styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display
 */
function SummaryTimestamp({ children, ...props }) {
  return (
    <StyledSummaryTimestamp {...props}>
      {children}
    </StyledSummaryTimestamp>
  );
}

export default SummaryTimestamp; 