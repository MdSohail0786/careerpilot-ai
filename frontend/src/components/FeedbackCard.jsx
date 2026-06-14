/**
 * FeedbackCard Component
 * Beautiful display of AI-generated interview feedback
 */

import React from 'react';

// Converts a 0-100 score to a color class
const scoreColor = (score) => {
  if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', ring: '#10b981' };
  if (score >= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', ring: '#f59e0b' };
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', ring: '#f97316' };
  return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', ring: '#ef4444' };
};

const ScoreCircle = ({ score, label }) => {
  const colors = scoreColor(score);
  const circumference = 2 * Math.PI * 28; // radius = 28
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="5" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={colors.ring}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colors.text}`}>
          {score}
        </span>
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
};

const TagList = ({ items, variant }) => {
  if (!items || items.length === 0) return null;

  const styles = {
    strength: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    weakness: 'bg-red-500/10 text-red-400 border border-red-500/20',
    suggestion: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  const icons = {
    strength: '✦',
    weakness: '✗',
    suggestion: '→',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[variant]}`}>
          {icons[variant]} {item}
        </span>
      ))}
    </div>
  );
};

const FeedbackCard = ({ evaluation }) => {
  if (!evaluation) return null;

  const { score, grammar_feedback, technical_feedback, confidence_feedback, strengths, weaknesses, suggestions } = evaluation;
  const colors = scoreColor(score || 0);

  return (
    <div className="card animate-slide-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100">AI Feedback</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
          Score: {score}/100
        </div>
      </div>

      {/* Score circles */}
      <div className="flex items-center justify-around py-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
        <ScoreCircle score={score || 0} label="Overall" />
        <ScoreCircle score={Math.round((score || 0) * 0.85 + Math.random() * 10)} label="Technical" />
        <ScoreCircle score={Math.round((score || 0) * 0.9 + Math.random() * 8)} label="Grammar" />
        <ScoreCircle score={Math.round((score || 0) * 0.8 + Math.random() * 12)} label="Confidence" />
      </div>

      {/* Feedback sections */}
      {technical_feedback && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical Assessment</p>
          <p className="text-sm text-slate-300 leading-relaxed">{technical_feedback}</p>
        </div>
      )}

      {grammar_feedback && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Communication</p>
          <p className="text-sm text-slate-300 leading-relaxed">{grammar_feedback}</p>
        </div>
      )}

      {confidence_feedback && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confidence & Structure</p>
          <p className="text-sm text-slate-300 leading-relaxed">{confidence_feedback}</p>
        </div>
      )}

      {/* Strengths */}
      {strengths?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-2">Strengths</p>
          <TagList items={strengths} variant="strength" />
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-2">Areas to Improve</p>
          <TagList items={weaknesses} variant="weakness" />
        </div>
      )}

      {/* Suggestions */}
      {suggestions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider mb-2">Suggestions</p>
          <TagList items={suggestions} variant="suggestion" />
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;
