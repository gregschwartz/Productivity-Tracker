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

const PlaceholderBase = styled.div`
  background-color: ${({ theme }) => theme.colors.border || '#e0e0e0'};
  animation: ${pulseAnimation} 1.5s infinite ease-in-out;
  border-radius: 4px;
`;

const SkeletonContainer = styled.div`
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.background || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.colors.border || '#e0e0e0'};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const TitlePlaceholder = styled(PlaceholderBase)`
  width: 60%;
  height: 20px;
  margin-bottom: 12px;
`;

const StatLinePlaceholder = styled(PlaceholderBase)`
  width: 80%;
  height: 16px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SkeletonStatCard = () => (
  <SkeletonContainer>
    <TitlePlaceholder />
    <StatLinePlaceholder />
    <StatLinePlaceholder style={{ width: '70%' }} />
  </SkeletonContainer>
);

export default SkeletonStatCard;
