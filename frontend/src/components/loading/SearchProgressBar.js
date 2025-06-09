import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressBarContainer = styled.div`
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BarBackground = styled.div`
  width: 100%;
  max-width: 400px;
  height: 12px;
  background-color: ${({ theme }) => theme.colors.border || '#e0e0e0'};
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const IndeterminateBar = styled(motion.div)`
  width: 40%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary || '#007bff'};
  border-radius: 6px;
`;

const MessagesContainer = styled.div`
  height: 20px; /* Fixed height to prevent layout shifts */
  text-align: center;
`;

const messages = [
  "brewing coffee",
  "fighting for the user",
  "searching for Kevin Flynn",
  "gathering results"
];

const SearchProgressBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ProgressBarContainer>
      <BarBackground>
        <IndeterminateBar
          initial={{ x: '-100%' }}
          animate={{ x: '250%' }} // 100% (bar width) + 150% (to go across)
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      </BarBackground>
      <AnimatePresence mode="wait">
        <motion.div
          key={messages[currentMessageIndex]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {messages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>
    </ProgressBarContainer>
  );
};

export default SearchProgressBar;
