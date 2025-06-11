import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const BarBackground = styled.div`
  width: 100%;
  height: 24px;
  background-color: ${({ theme }) => theme.colors.border || '#e0e0e0'};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const IndeterminateBar = styled(motion.div)`
  width: 30%;
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary || '#007bff'} 0%,
    ${({ theme }) => theme.colors.primary || '#007bff'}aa 50%,
    ${({ theme }) => theme.colors.primary || '#007bff'} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2s ease-in-out infinite;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
`;

const MessagesContainer = styled.div`
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const messages = [
  "🔍 Reticulating splines...",
  "⚡ Fighting for the user...",
  "🎮 Searching for Kevin Flynn...",
  "🌐 Entering the Grid...",
  "☕ Brewing coffee...",
  "🚀 Optimizing search algorithms...",
  "📊 Gathering results..."
];

const SearchProgressBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ProgressBarContainer>
      <BarBackground>
        <IndeterminateBar
          initial={{ x: '-100%' }}
          animate={{ x: '370%' }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
        />
      </BarBackground>
      <AnimatePresence mode="wait">
        <motion.div
          key={messages[currentMessageIndex]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.8 }}
        >
          {messages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>
    </ProgressBarContainer>
  );
};

export default SearchProgressBar;
