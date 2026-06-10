/**
 * Loading Component
 * Reusable loading spinner with optional text
 */

import React from 'react';

const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const Loading = ({ size = 'md', text = '', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full border-surface-700 border-t-brand-500 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default Loading;
