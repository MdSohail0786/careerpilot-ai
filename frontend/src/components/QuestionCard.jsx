/**
 * QuestionCard Component
 * Displays the current interview question with metadata
 */

import React from 'react';

const QuestionCard = ({ question, questionNumber, totalQuestions, isFollowUp, role }) => {
  const progress = Math.round(((questionNumber - 1) / totalQuestions) * 100);

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
            {isFollowUp ? '↳ Follow-up' : `Question ${questionNumber} of ${totalQuestions}`}
          </span>
          {isFollowUp && (
            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
              Contextual
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 bg-surface-800 px-2.5 py-1 rounded-full border border-surface-700">
          {role}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-800 rounded-full h-1 mb-5">
        <div
          className="bg-brand-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question text */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-100 text-base leading-relaxed font-medium flex-1">
          {question}
        </p>
      </div>
    </div>
  );
};

export default QuestionCard;
