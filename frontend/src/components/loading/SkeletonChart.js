import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.4;
  }
`;

const ChartPlaceholder = styled.div`
  width: 100%;
  height: 200px; /* Default height, can be overridden by props or container */
  background-color: ${({ theme }) => theme.colors.border || '#e0e0e0'};
  border-radius: 8px;
  animation: ${pulseAnimation} 1.5s infinite ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SkeletonChart = ({ height }) => (
  <ChartPlaceholder style={{ height: height || '200px' }} />
);

export default SkeletonChart;
