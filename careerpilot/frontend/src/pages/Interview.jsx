/**
 * Interview Page
 * The core interview experience: question → answer → feedback → next
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { interviewAPI, reportAPI } from '../api';
import QuestionCard from '../components/QuestionCard';
import FeedbackCard from '../components/FeedbackCard';
import VoiceRecorder from '../components/VoiceRecorder';
import Loading from '../components/Loading';

const STAGES = {
  ANSWERING: 'answering',
  EVALUATING: 'evaluating',
  FEEDBACK: 'feedback',
  GENERATING_NEXT: 'generating_next',
  COMPLETE: 'complete',
  GENERATING_REPORT: 'generating_report',
};

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state;

  // Redirect if no interview data
  useEffect(() => {
    if (!stateData?.interviewId) {
      navigate('/dashboard');
    }
  }, [stateData, navigate]);

  const [stage, setStage] = useState(STAGES.ANSWERING);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [question, setQuestion] = useState(stateData?.question || '');
  const [questionNumber, setQuestionNumber] = useState(stateData?.questionNumber || 1);
  const [totalQuestions] = useState(stateData?.totalQuestions || 10);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [role] = useState(stateData?.role || '');
  const [interviewId] = useState(stateData?.interviewId || '');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Focus textarea when in answering stage
  useEffect(() => {
    if (stage === STAGES.ANSWERING && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [stage, question]);

  // Handle voice transcript
  const handleVoiceTranscript = (text) => {
    setAnswer(text);
  };

  // Submit answer for AI evaluation
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }
    setError('');
    setStage(STAGES.EVALUATING);

    try {
      const { data } = await interviewAPI.submitAnswer(interviewId, answer.trim());
      setEvaluation(data.evaluation);
      setStage(STAGES.FEEDBACK);
    } catch (err) {
      setError(err.response?.data?.message || 'Evaluation failed. Please try again.');
      setStage(STAGES.ANSWERING);
    }
  };

  // Move to the next question
  const handleNextQuestion = async () => {
    setStage(STAGES.GENERATING_NEXT);
    setError('');

    try {
      const { data } = await interviewAPI.nextQuestion(interviewId);

      if (data.completed) {
        // Interview complete - generate report
        setStage(STAGES.GENERATING_REPORT);
        const { data: reportData } = await reportAPI.generate(interviewId);
        navigate(`/reports/${reportData.report._id}`, { replace: true });
        return;
      }

      // Next question received
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setIsFollowUp(data.isFollowUp);
      setAnswer('');
      setEvaluation(null);
      setStage(STAGES.ANSWERING);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load next question.');
      setStage(STAGES.FEEDBACK);
    }
  };

  // Skip current question (penalty: score 0)
  const handleSkip = async () => {
    setAnswer('(Skipped)');
    setError('');
    setStage(STAGES.EVALUATING);
    try {
      const { data } = await interviewAPI.submitAnswer(interviewId, '');
      setEvaluation(data.evaluation);
      setStage(STAGES.FEEDBACK);
    } catch {
      setStage(STAGES.ANSWERING);
    }
  };

  if (!stateData?.interviewId) return null;

  // ── Loading states ──────────────────────────────────────────────────────────
  if (stage === STAGES.GENERATING_REPORT) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4">
        <Loading size="xl" text="Generating your performance report..." />
        <p className="text-slate-500 text-sm">Analyzing all your answers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-sm text-slate-400 font-medium">{role}</span>
          </div>
          <span className="text-xs text-slate-500">
            {questionNumber}/{totalQuestions} questions
          </span>
        </div>

        {/* ── Question card ── */}
        <QuestionCard
          question={question}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          isFollowUp={isFollowUp}
          role={role}
        />

        {/* ── Answer area (only in ANSWERING stage) ── */}
        {stage === STAGES.ANSWERING && (
          <div className="card space-y-4 animate-slide-up">
            <h3 className="text-sm font-semibold text-slate-300">Your Answer</h3>

            {/* Voice recorder */}
            <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={false} />

            {/* Text area */}
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here, or use voice input above..."
              rows={6}
              className="input resize-none text-sm leading-relaxed font-mono"
            />

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                className="btn-primary flex-1 py-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Answer
              </button>
              <button
                onClick={handleSkip}
                className="btn-secondary px-4 py-3 text-slate-500"
              >
                Skip
              </button>
            </div>

            <p className="text-xs text-slate-600 text-center">
              Take your time — think before you answer, just like a real interview
            </p>
          </div>
        )}

        {/* ── Evaluating state ── */}
        {stage === STAGES.EVALUATING && (
          <div className="card flex flex-col items-center py-10 gap-4">
            <Loading size="lg" text="AI is evaluating your answer..." />
            <p className="text-slate-600 text-xs text-center">
              Analyzing technical accuracy, grammar, and confidence...
            </p>
          </div>
        )}

        {/* ── Feedback card ── */}
        {stage === STAGES.FEEDBACK && evaluation && (
          <div className="space-y-4 animate-slide-up">
            <FeedbackCard evaluation={evaluation} />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleNextQuestion}
                className="btn-primary flex-1 py-3"
              >
                {questionNumber >= totalQuestions ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Finish & See Report
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Next Question
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Generating next ── */}
        {stage === STAGES.GENERATING_NEXT && (
          <div className="card flex flex-col items-center py-10 gap-4">
            <Loading size="lg" text="Preparing next question..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default Interview;
