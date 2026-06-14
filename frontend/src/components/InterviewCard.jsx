/**
 * InterviewCard Component
 * Displays a selectable interview role card on the Dashboard
 */

import React from 'react';

const roleIcons = {
  'Frontend Developer': (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  'React Developer': (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="2" strokeWidth={2} />
      <path strokeWidth={1.8} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path strokeLinecap="round" strokeWidth={1.8}
        d="M12 2c0 0-6 3.5-6 10s6 10 6 10M12 2c0 0 6 3.5 6 10s-6 10-6 10M2 12h20" />
    </svg>
  ),
  'MERN Stack Developer': (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4.5 12.5l7.5-7.5 7.5 7.5M4.5 19.5l7.5-7.5 7.5 7.5" />
    </svg>
  ),
  'Node.js Developer': (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

const roleColors = {
  'Frontend Developer': 'from-blue-600/20 to-blue-900/10 border-blue-700/40 hover:border-blue-500/60',
  'React Developer': 'from-cyan-600/20 to-cyan-900/10 border-cyan-700/40 hover:border-cyan-500/60',
  'MERN Stack Developer': 'from-green-600/20 to-green-900/10 border-green-700/40 hover:border-green-500/60',
  'Node.js Developer': 'from-emerald-600/20 to-emerald-900/10 border-emerald-700/40 hover:border-emerald-500/60',
};

const iconColors = {
  'Frontend Developer': 'text-blue-400 bg-blue-500/10',
  'React Developer': 'text-cyan-400 bg-cyan-500/10',
  'MERN Stack Developer': 'text-green-400 bg-green-500/10',
  'Node.js Developer': 'text-emerald-400 bg-emerald-500/10',
};

const roleDescriptions = {
  'Frontend Developer': 'HTML, CSS, JavaScript, responsive design & browser APIs',
  'React Developer': 'React hooks, state management, component patterns & performance',
  'MERN Stack Developer': 'MongoDB, Express, React & Node.js full-stack architecture',
  'Node.js Developer': 'Server-side JS, REST APIs, async patterns & databases',
};

const InterviewCard = ({ role, selected, onClick }) => {
  return (
    <button
      onClick={() => onClick(role)}
      className={`w-full text-left p-5 rounded-2xl border bg-gradient-to-br
        transition-all duration-200 cursor-pointer
        ${roleColors[role]}
        ${selected ? 'ring-2 ring-brand-500 scale-[1.02] shadow-lg shadow-brand-900/30' : 'hover:scale-[1.01]'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconColors[role]}`}>
          {roleIcons[role]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-100 text-sm">{role}</h3>
            {selected && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {roleDescriptions[role]}
          </p>
        </div>
      </div>
    </button>
  );
};

export default InterviewCard;
