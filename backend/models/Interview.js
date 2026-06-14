/**
 * Interview Model
 * Stores complete interview session data including Q&A and scores
 */

const mongoose = require('mongoose');

// Schema for individual Q&A pairs
const questionAnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    default: '',
  },
  isFollowUp: {
    type: Boolean,
    default: false,
  },
  evaluation: {
    score: { type: Number, default: 0 },
    grammar_feedback: { type: String, default: '' },
    technical_feedback: { type: String, default: '' },
    confidence_feedback: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'Frontend Developer',
        'React Developer',
        'MERN Stack Developer',
        'Node.js Developer',
      ],
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    questionAnswers: [questionAnswerSchema],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 10,
    },
    // Summary scores computed at end of interview
    overallScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Virtual: Calculate progress percentage ────────────────────────────────────
interviewSchema.virtual('progress').get(function () {
  return Math.round((this.questionAnswers.length / this.totalQuestions) * 100);
});

module.exports = mongoose.model('Interview', interviewSchema);
