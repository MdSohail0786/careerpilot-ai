/**
 * useInterview hook
 * Encapsulates the interview state machine for use in the Interview page.
 * Keeps the page component clean and logic reusable.
 */

import { useState, useCallback } from 'react';
import { interviewAPI, reportAPI } from '../api';
import { useNavigate } from 'react-router-dom';

export const STAGES = {
  ANSWERING: 'answering',
  EVALUATING: 'evaluating',
  FEEDBACK: 'feedback',
  GENERATING_NEXT: 'generating_next',
  GENERATING_REPORT: 'generating_report',
};

const useInterview = (initialState) => {
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGES.ANSWERING);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [question, setQuestion] = useState(initialState?.question || '');
  const [questionNumber, setQuestionNumber] = useState(initialState?.questionNumber || 1);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [error, setError] = useState('');

  const interviewId = initialState?.interviewId;
  const totalQuestions = initialState?.totalQuestions || 10;
  const role = initialState?.role || '';

  /**
   * Submit the current answer for AI evaluation
   */
  const submitAnswer = useCallback(async (answerText) => {
    if (!answerText.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }
    setError('');
    setStage(STAGES.EVALUATING);
    try {
      const { data } = await interviewAPI.submitAnswer(interviewId, answerText.trim());
      setEvaluation(data.evaluation);
      setStage(STAGES.FEEDBACK);
    } catch (err) {
      setError(err.response?.data?.message || 'Evaluation failed. Please try again.');
      setStage(STAGES.ANSWERING);
    }
  }, [interviewId]);

  /**
   * Request the next question or finish the interview
   */
  const nextQuestion = useCallback(async () => {
    setStage(STAGES.GENERATING_NEXT);
    setError('');
    try {
      const { data } = await interviewAPI.nextQuestion(interviewId);

      if (data.completed) {
        setStage(STAGES.GENERATING_REPORT);
        const { data: reportData } = await reportAPI.generate(interviewId);
        navigate(`/reports/${reportData.report._id}`, { replace: true });
        return;
      }

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
  }, [interviewId, navigate]);

  /**
   * Skip the current question (submits empty answer)
   */
  const skipQuestion = useCallback(async () => {
    setError('');
    setStage(STAGES.EVALUATING);
    try {
      const { data } = await interviewAPI.submitAnswer(interviewId, '');
      setEvaluation(data.evaluation);
      setStage(STAGES.FEEDBACK);
    } catch {
      setStage(STAGES.ANSWERING);
    }
  }, [interviewId]);

  return {
    stage,
    answer,
    setAnswer,
    evaluation,
    question,
    questionNumber,
    totalQuestions,
    isFollowUp,
    role,
    error,
    submitAnswer,
    nextQuestion,
    skipQuestion,
  };
};

export default useInterview;
