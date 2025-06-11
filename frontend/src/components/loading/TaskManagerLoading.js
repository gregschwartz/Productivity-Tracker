import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Clock, Coffee, Zap, Target } from 'lucide-react';

const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;
  gap: 24px;
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const IconWrapper = styled.div`
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeInOut} 2.4s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  
  svg {
    width: 30px;
    height: 30px;
    color: ${props => props.theme.colors.primary};
  }
`;

const BounceIcon = styled.div`
  animation: ${bounce} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
`;

const RotateIcon = styled.div`
  animation: ${rotate} 3s linear infinite;
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  animation: ${fadeInOut} 2s ease-in-out infinite;
`;

const messages = [
  "Getting your tasks ready...",
  "Loading productivity data...",
  "Preparing your workspace...",
  "Almost there..."
];

const TaskManagerLoading = () => {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <LoadingContainer>
      <IconGrid>
        <IconWrapper $delay="0s">
          <BounceIcon $delay="0s">
            <Clock />
          </BounceIcon>
        </IconWrapper>
        <IconWrapper $delay="0.6s">
          <BounceIcon $delay="0.3s">
            <Coffee />
          </BounceIcon>
        </IconWrapper>
        <IconWrapper $delay="1.2s">
          <RotateIcon>
            <Zap />
          </RotateIcon>
        </IconWrapper>
        <IconWrapper $delay="1.8s">
          <BounceIcon $delay="0.9s">
            <Target />
          </BounceIcon>
        </IconWrapper>
      </IconGrid>
      <LoadingText>{messages[messageIndex]}</LoadingText>
    </LoadingContainer>
  );
};

export default TaskManagerLoading;