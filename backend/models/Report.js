/**
 * Report Model
 * Stores comprehensive interview performance reports
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
    },
    // Aggregate scores (0-100)
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grammarScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    technicalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Aggregated feedback across all questions
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],

    // Per-question score breakdown for charts
    scoreBreakdown: [
      {
        questionNumber: Number,
        score: Number,
        technicalScore: Number,
        grammarScore: Number,
        confidenceScore: Number,
      },
    ],

    totalQuestions: {
      type: Number,
      default: 10,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index for efficient user report queries ───────────────────────────────────
reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
