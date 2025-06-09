import React from "react";
import styled from "styled-components";
import { Sparkles, RefreshCw } from "lucide-react";

/**
 * Generate button styled component for AI summary generation
 */
const StyledGenerateButton = styled.button.attrs((props) => ({
  className: `flex items-center gap-2 px-6 py-3 border-none rounded-lg font-medium text-sm transition-all duration-200 ${
    props.disabled
      ? "cursor-not-allowed"
      : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
  }`,
  disabled: props.disabled,
}))`
  background: ${(props) =>
    props.disabled
      ? props.theme.colors.backgroundHover
      : props.theme.colors.primary};
  color: ${(props) =>
    props.disabled
      ? props.theme.colors.text.muted
      : props.theme.colors.primaryText};

  ${(props) =>
    props.theme.name === "tron" &&
    !props.disabled &&
    `
    border: 1px solid ${props.theme.colors.primary};
    box-shadow: ${props.theme.glow.small};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: ${props.theme.fonts.mono};
  `}

  &:hover:not(:disabled) {
    ${(props) =>
      props.theme.name === "tron" &&
      `
      box-shadow: ${props.theme.glow.medium};
    `}
  }

  svg {
    width: 16px;
    height: 16px;

    ${(props) =>
      props.generating &&
      `
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Button component for generating AI summaries
 * @param {Object} props - Component props
 * @param {boolean} props.generating - Whether summary is currently being generated
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.hasSummary - Whether summary already exists
 * @param {number} props.taskCount - Number of tasks for the week
 */
function GenerateButton({ 
  generating = false, 
  disabled = false, 
  onClick, 
  hasSummary = false, 
  taskCount = 0 
}) {
  const getButtonText = () => {
    if (generating) return "Generating...";
    if (hasSummary) return "Summary Already Generated";
    if (taskCount === 0) return "No Tasks This Week";
    return "Generate AI Summary";
  };

  return (
    <StyledGenerateButton
      onClick={onClick}
      disabled={disabled}
      generating={generating}
    >
      {generating ? <RefreshCw /> : <Sparkles />}
      {getButtonText()}
    </StyledGenerateButton>
  );
}

export default GenerateButton; 