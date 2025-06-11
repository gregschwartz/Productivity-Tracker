import React from 'react';
import styled, { keyframes } from 'styled-components';
import { BarChart3 } from 'lucide-react';

const float = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-10px) scale(1.05);
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

const bars = keyframes`
  0%, 100% {
    transform: scaleY(0.3);
  }
  25% {
    transform: scaleY(0.8);
  }
  50% {
    transform: scaleY(0.6);
  }
  75% {
    transform: scaleY(0.9);
  }
`;

const ChartPlaceholder = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surface} 0%,
    ${({ theme }) => theme.colors.border}30 50%,
    ${({ theme }) => theme.colors.surface} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 3s ease-in-out infinite;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const ChartIcon = styled.div`
  animation: ${float} 4s ease-in-out infinite;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 1;
`;

const FakeBars = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  align-items: end;
  height: 60px;
`;

const FakeBar = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.primary}40;
  border-radius: 2px;
  transform-origin: bottom;
  animation: ${bars} 2.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  max-width: 20px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.7;
`;

const SkeletonChart = ({ height }) => (
  <ChartPlaceholder style={{ height: height || '200px' }}>
    <ChartIcon>
      <BarChart3 size={32} />
      <LoadingText>Loading chart data...</LoadingText>
    </ChartIcon>
    <FakeBars>
      <FakeBar $delay="0s" />
      <FakeBar $delay="0.2s" />
      <FakeBar $delay="0.4s" />
      <FakeBar $delay="0.6s" />
      <FakeBar $delay="0.8s" />
      <FakeBar $delay="1.0s" />
      <FakeBar $delay="1.2s" />
    </FakeBars>
  </ChartPlaceholder>
);

export default SkeletonChart;
