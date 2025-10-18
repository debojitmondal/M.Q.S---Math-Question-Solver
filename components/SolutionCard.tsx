
import React from 'react';

interface SolutionCardProps {
  solution: string;
}

const SolutionCard: React.FC<SolutionCardProps> = ({ solution }) => {
    // A simple parser to handle markdown-like text from Gemini
    const formattedSolution = solution
        .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-light-text dark:text-dark-text">$1</h3>')
        .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-light-text dark:text-dark-text">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>')
        .replace(/\n/g, '<br />');

  return (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md w-full">
      <div 
        className="prose prose-slate dark:prose-invert max-w-none text-light-text dark:text-dark-text whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formattedSolution }}
      />
    </div>
  );
};

export default SolutionCard;
