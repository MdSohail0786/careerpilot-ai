/**
 * Reports Page
 * Interview history list + detailed single report view with charts
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale, ArcElement,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { reportAPI } from '../api';
import Loading from '../components/Loading';

// Register all chart components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, RadialLinearScale, ArcElement
);

const CHART_DEFAULTS = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, min: 0, max: 100 },
  },
};

const scoreColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const scoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
};

// ── Single Report View ────────────────────────────────────────────────────────
const ReportDetail = ({ report }) => {
  const navigate = useNavigate();

  const labels = report.scoreBreakdown?.map((s) => `Q${s.questionNumber}`) || [];
  const scores = report.scoreBreakdown?.map((s) => s.score) || [];

  const lineData = {
    labels,
    datasets: [{
      label: 'Score',
      data: scores,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }],
  };

  const barData = {
    labels: ['Technical', 'Grammar', 'Confidence'],
    datasets: [{
      data: [report.technicalScore, report.grammarScore, report.confidenceScore],
      backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)'],
      borderRadius: 6,
    }],
  };

  const radarData = {
    labels: ['Technical', 'Grammar', 'Confidence', 'Overall'],
    datasets: [{
      data: [report.technicalScore, report.grammarScore, report.confidenceScore, report.overallScore],
      backgroundColor: 'rgba(99,102,241,0.15)',
      borderColor: '#6366f1',
      pointBackgroundColor: '#6366f1',
    }],
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back */}
      <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reports
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">{report.role}</p>
            <h2 className="text-2xl font-bold text-slate-100">Interview Report</h2>
            <p className="text-slate-400 text-sm mt-1">
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })} · {report.duration} min · {report.totalQuestions} questions
            </p>
          </div>
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold"
              style={{ borderColor: scoreColor(report.overallScore), color: scoreColor(report.overallScore) }}
            >
              {report.overallScore}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{scoreLabel(report.overallScore)}</p>
          </div>
        </div>
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Technical', score: report.technicalScore, color: '#6366f1' },
          { label: 'Grammar', score: report.grammarScore, color: '#10b981' },
          { label: 'Confidence', score: report.confidenceScore, color: '#f59e0b' },
        ].map(({ label, score, color }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold" style={{ color }}>{score}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Score Per Question</p>
          <Line data={lineData} options={CHART_DEFAULTS} />
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Category Breakdown</p>
          <Bar data={barData} options={CHART_DEFAULTS} />
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-semibold text-slate-300 mb-4">Performance Radar</p>
        <div className="max-w-xs mx-auto">
          <Radar
            data={radarData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                r: {
                  min: 0, max: 100,
                  grid: { color: '#1e293b' },
                  ticks: { color: '#64748b', font: { size: 10 }, stepSize: 20 },
                  pointLabels: { color: '#94a3b8', font: { size: 12 } },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Strengths / Weaknesses / Suggestions */}
      <div className="grid md:grid-cols-3 gap-4">
        {report.strengths?.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">✦ Strengths</p>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-emerald-500 flex-shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.weaknesses?.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">✗ Areas to Improve</p>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-red-500 flex-shrink-0">•</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.suggestions?.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">→ Suggestions</p>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-blue-500 flex-shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Reports List View ─────────────────────────────────────────────────────────
const ReportsList = ({ reports, onSelect }) => {
  if (reports.length === 0) {
    return (
      <div className="card text-center py-16">
        <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-slate-400 font-medium">No interviews yet</h3>
        <p className="text-slate-600 text-sm mt-1">Complete an interview to see your report here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <button
          key={report._id}
          onClick={() => onSelect(report._id)}
          className="w-full card card-hover text-left flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-medium text-slate-200">{report.role}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })} · {report.totalQuestions} questions · {report.duration} min
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold" style={{ color: scoreColor(report.overallScore) }}>
              {report.overallScore}
            </p>
            <p className="text-xs" style={{ color: scoreColor(report.overallScore) }}>
              {scoreLabel(report.overallScore)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

// ── Main Reports Page ─────────────────────────────────────────────────────────
const Reports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (id) {
      loadSingleReport(id);
    } else {
      setSelectedReport(null);
    }
  }, [id]);

  const loadHistory = async () => {
    try {
      const { data } = await reportAPI.getHistory();
      setReports(data.reports || []);
    } catch {
      setError('Failed to load report history.');
    } finally {
      setLoading(false);
    }
  };

  const loadSingleReport = async (reportId) => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getReport(reportId);
      setSelectedReport(data.report);
    } catch {
      setError('Report not found.');
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loading size="lg" text="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {!id && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100">Interview Reports</h1>
            <p className="text-slate-400 text-sm mt-1">
              {reports.length} interview{reports.length !== 1 ? 's' : ''} completed
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {id && selectedReport ? (
          <ReportDetail report={selectedReport} />
        ) : (
          <ReportsList reports={reports} onSelect={handleSelect} />
        )}
      </div>
    </div>
  );
};

export default Reports;
