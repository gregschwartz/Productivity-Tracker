import React from 'react';
import SectionHeader from './SectionHeader.js';
import SectionTitle from './SectionTitle.js';
import SectionDescription from './SectionDescription.js';

/**
 * Compound section header with title and description for consistent summary sections.
 * @param {string} title - The section title
 * @param {string} description - The section description (optional)
 * @param {React.ReactNode} children - Additional content in the description area
 */
const SectionSummary = ({ title, description, children }) => {
  return (
    <SectionHeader>
      <SectionTitle>
        {title}
      </SectionTitle>
      <SectionDescription>
        {description}
        {children}
      </SectionDescription>
    </SectionHeader>
  );
};

export default SectionSummary; 