/**
 * Report Controller
 * Generates and retrieves interview performance reports
 */

const Report = require('../models/Report');
const Interview = require('../models/Interview');
const { generateFinalReport } = require('../services/openai.service');

/**
 * Generate and save a report for a completed interview
 * POST /api/report/generate
 */
const generateReport = async (req, res) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: 'Interview ID is required.' });
    }

    // Find the completed interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.user._id,
      status: 'completed',
    });

    if (!interview) {
      return res.status(404).json({ message: 'Completed interview not found.' });
    }

    // Check if report already exists for this interview
    const existingReport = await Report.findOne({ interviewId });
    if (existingReport) {
      return res.json({ report: existingReport });
    }

    // Generate comprehensive report via AI
    const reportData = await generateFinalReport(
      interview.role,
      interview.questionAnswers
    );

    // Build per-question score breakdown for charts
    const scoreBreakdown = interview.questionAnswers.map((qa, index) => ({
      questionNumber: index + 1,
      score: qa.evaluation?.score || 0,
      technicalScore: qa.evaluation?.score ? Math.round(qa.evaluation.score * 0.6) : 0,
      grammarScore: qa.evaluation?.score ? Math.round(qa.evaluation.score * 0.2) : 0,
      confidenceScore: qa.evaluation?.score ? Math.round(qa.evaluation.score * 0.2) : 0,
    }));

    // Calculate interview duration in minutes
    const startTime = new Date(interview.createdAt);
    const endTime = interview.completedAt ? new Date(interview.completedAt) : new Date();
    const duration = Math.round((endTime - startTime) / 60000);

    // Save report to database
    const report = await Report.create({
      userId: req.user._id,
      interviewId: interview._id,
      role: interview.role,
      overallScore: reportData.overallScore,
      grammarScore: reportData.grammarScore,
      technicalScore: reportData.technicalScore,
      confidenceScore: reportData.confidenceScore,
      strengths: reportData.strengths,
      weaknesses: reportData.weaknesses,
      suggestions: reportData.suggestions,
      scoreBreakdown,
      totalQuestions: interview.questionAnswers.length,
      duration,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report. Please try again.' });
  }
};

/**
 * Get a single report by ID
 * GET /api/report/:id
 */
const getReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('interviewId', 'role questionAnswers createdAt');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Failed to fetch report.' });
  }
};

/**
 * Get all reports for the authenticated user (history)
 * GET /api/report/history
 */
const getReportHistory = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // Most recent first
      .select('role overallScore grammarScore technicalScore confidenceScore createdAt duration totalQuestions');

    res.json({ reports });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ message: 'Failed to fetch report history.' });
  }
};

/**
 * Get report by interview ID
 * GET /api/report/interview/:interviewId
 */
const getReportByInterview = async (req, res) => {
  try {
    const report = await Report.findOne({
      interviewId: req.params.interviewId,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found for this interview.' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report by interview error:', error);
    res.status(500).json({ message: 'Failed to fetch report.' });
  }
};

module.exports = { generateReport, getReport, getReportHistory, getReportByInterview };
