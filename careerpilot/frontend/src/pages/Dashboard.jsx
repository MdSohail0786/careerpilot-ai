/**
 * Dashboard Page
 * Main landing page after login - role selection and interview start
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI, reportAPI } from '../api';
import InterviewCard from '../components/InterviewCard';
import Loading from '../components/Loading';

const ROLES = [
  'Frontend Developer',
  'React Developer',
  'MERN Stack Developer',
  'Node.js Developer',
];

const StatCard = ({ label, value, sub, icon }) => (
  <div className="card flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-xs text-brand-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [starting, setStarting] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [error, setError] = useState('');

  // Load recent interview history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await reportAPI.getHistory();
        setRecentReports(data.reports?.slice(0, 3) || []);
      } catch {
        // Silently fail - history is not critical
      }
    };
    loadHistory();
  }, []);

  const handleStartInterview = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }
    setError('');
    setStarting(true);
    try {
      const { data } = await interviewAPI.start(selectedRole);
      // Navigate to interview page with interview data
      navigate('/interview', {
        state: {
          interviewId: data.interviewId,
          question: data.question,
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          role: data.role,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview. Please try again.');
      setStarting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Welcome Header ── */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Ready to practice</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Select a role and start a mock technical interview — get instant AI feedback.
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-slide-up">
          <StatCard
            label="Interviews completed"
            value={user?.totalInterviews || 0}
            icon={<svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard
            label="Average score"
            value={user?.averageScore ? `${user.averageScore}%` : '—'}
            sub={user?.averageScore >= 70 ? 'Great performance!' : user?.averageScore ? 'Keep improving!' : 'Complete an interview'}
            icon={<svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
          <div className="card col-span-2 sm:col-span-1 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">10</p>
              <p className="text-xs text-slate-400">Questions per session</p>
              <p className="text-xs text-purple-400 mt-0.5">AI-powered evaluation</p>
            </div>
          </div>
        </div>

        {/* ── Role Selection ── */}
        <div className="card animate-slide-up">
          <h2 className="text-base font-semibold text-slate-100 mb-1">Select Interview Role</h2>
          <p className="text-sm text-slate-400 mb-4">
            Choose the position you want to practice for. Questions will be tailored to that role.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLES.map((role) => (
              <InterviewCard
                key={role}
                role={role}
                selected={selectedRole === role}
                onClick={setSelectedRole}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4">
            <button
              onClick={handleStartInterview}
              disabled={starting || !selectedRole}
              className="btn-primary px-8 py-3"
            >
              {starting ? (
                <><Loading size="sm" /> Generating Questions...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Interview
                </>
              )}
            </button>
            {selectedRole && !starting && (
              <p className="text-xs text-slate-500">
                10 questions · AI evaluation · ~20 min
              </p>
            )}
          </div>
        </div>

        {/* ── Recent History ── */}
        {recentReports.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-100">Recent Interviews</h2>
              <button onClick={() => navigate('/reports')} className="text-xs text-brand-400 hover:text-brand-300">
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentReports.map((report) => (
                <div key={report._id} className="card flex items-center justify-between py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{report.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getScoreColor(report.overallScore)}`}>
                      {report.overallScore}%
                    </p>
                    <p className="text-xs text-slate-500">{report.totalQuestions} questions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
