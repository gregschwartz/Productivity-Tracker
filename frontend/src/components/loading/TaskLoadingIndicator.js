import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.75);
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: inline-block;
  animation: ${pulse} 1.4s infinite ease-in-out both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
`;

const TaskLoadingIndicatorContainer = styled.div`
  display: inline-block;
`;

const TaskLoadingIndicator = () => (
  <TaskLoadingIndicatorContainer>
    <Dot />
    <Dot />
    <Dot />
  </TaskLoadingIndicatorContainer>
);

export default TaskLoadingIndicator;
