import React from "react";
import styled from "styled-components";

/**
 * Summary content styled component with nested styling for headings, paragraphs, and lists
 */
const StyledSummaryContent = styled.div.attrs(() => ({
  className: "leading-relaxed",
}))`
  color: ${(props) => props.theme.colors.text.primary};

  h4 {
    color: ${(props) => props.theme.colors.text.muted};
    margin: 16px 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin-bottom: 12px;
  }

  ul {
    margin: 8px 0 16px 0;
    padding-left: 20px;
    list-style-type: disc;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    background: ${(props) => props.theme.colors.primary}30;
    color: ${(props) => props.theme.colors.primary};
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 600;
  }
`;

/**
 * Component for displaying summary content with formatted text, recommendations, and proper styling
 * @param {Object} props - Component props
 * @param {Object} props.summary - Summary object containing text and recommendations
 * @param {string} props.summary.summary - Main summary text
 * @param {Array} props.summary.recommendations - Array of recommendation strings
 */
function SummaryContent({ summary }) {
  if (!summary) return null;

  return (
    <StyledSummaryContent>
      <p>{summary.summary}</p>

      {summary.recommendations && summary.recommendations.length > 0 && (
        <>
          <h4>Recommendations for next week</h4>
          <ul>
            {summary.recommendations.map((rec, index) => (
              <li
                key={index}
                dangerouslySetInnerHTML={{ __html: rec }}
              ></li>
            ))}
          </ul>
        </>
      )}
    </StyledSummaryContent>
  );
}

export default SummaryContent; 