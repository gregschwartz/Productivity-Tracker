// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock framer-motion globally
jest.mock('framer-motion', () => {
  const React = require('react');
  
  // Create a proper mock component that works with styled-components
  const createMockMotionComponent = (element) => {
    const Component = React.forwardRef((props, ref) => {
      const { children, ...otherProps } = props;
      return React.createElement(element, { ...otherProps, ref }, children);
    });
    Component.displayName = `motion.${element}`;
    return Component;
  };
  
  return {
    motion: {
      div: createMockMotionComponent('div'),
      button: createMockMotionComponent('button'),
      form: createMockMotionComponent('form'),
      section: createMockMotionComponent('section'),
      article: createMockMotionComponent('article'),
      span: createMockMotionComponent('span'),
      h1: createMockMotionComponent('h1'),
      h2: createMockMotionComponent('h2'),
      h3: createMockMotionComponent('h3'),
      p: createMockMotionComponent('p'),
      ul: createMockMotionComponent('ul'),
      li: createMockMotionComponent('li'),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia with comprehensive support for framer-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => {
    const mockMediaQuery = {
      matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    
    // Ensure addListener is always available
    if (!mockMediaQuery.addListener) {
      mockMediaQuery.addListener = jest.fn();
    }
    
    return mockMediaQuery;
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock crypto.randomUUID for generating task IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  }
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock performance.now for testing timing-related functionality
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Suppress console warnings during tests unless needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Helper function to create mock localStorage
export const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
}; 