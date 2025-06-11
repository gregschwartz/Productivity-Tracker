import React from 'react';
import styled, { keyframes } from 'styled-components';

const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const gradientMove = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const PlaceholderBase = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.border} 0%,
    ${({ theme }) => theme.colors.textSecondary}40 50%,
    ${({ theme }) => theme.colors.border} 100%
  );
  background-size: 200% 100%;
  animation: ${gradientMove} 2.2s ease-in-out infinite;
  border-radius: 6px;
`;

const SkeletonContainer = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  animation: ${breathe} 3.5s ease-in-out infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${({ theme }) => theme.colors.primary}15 50%,
      transparent 100%
    );
    animation: ${shimmer} 3s ease-in-out infinite;
    pointer-events: none;
  }
`;

const TitlePlaceholder = styled(PlaceholderBase)`
  width: 65%;
  height: 18px;
  margin-bottom: 16px;
  animation-delay: 0.1s;
`;

const StatLinePlaceholder = styled(PlaceholderBase)`
  height: 32px;
  margin-bottom: 8px;
  animation-delay: 0.2s;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SkeletonStatCard = () => (
  <SkeletonContainer>
    <TitlePlaceholder />
    <StatLinePlaceholder />
    <StatLinePlaceholder style={{ width: '75%', animationDelay: '0.3s' }} />
  </SkeletonContainer>
);

export default SkeletonStatCard;
