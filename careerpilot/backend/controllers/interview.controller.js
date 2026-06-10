/**
 * Interview Controller
 * Manages the interview flow: start, answer, next question
 */

const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateQuestion, generateFollowUpQuestion, evaluateAnswer } = require('../services/openai.service');

const VALID_ROLES = [
  'Frontend Developer',
  'React Developer',
  'MERN Stack Developer',
  'Node.js Developer',
];

const TOTAL_QUESTIONS = 10;
// Every 3rd question becomes a follow-up for a realistic feel
const FOLLOW_UP_INTERVAL = 3;

/**
 * Start a new interview session
 * POST /api/interview/start
 */
const startInterview = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    // Check if user already has an in-progress interview and abandon it
    await Interview.updateMany(
      { userId: req.user._id, status: 'in-progress' },
      { status: 'abandoned' }
    );

    // Generate the first question
    const question = await generateQuestion(role, []);

    // Create interview session in DB
    const interview = await Interview.create({
      userId: req.user._id,
      role,
      status: 'in-progress',
      totalQuestions: TOTAL_QUESTIONS,
      questionAnswers: [
        {
          question,
          answer: '',
          isFollowUp: false,
          evaluation: {},
        },
      ],
    });

    res.status(201).json({
      message: 'Interview started!',
      interviewId: interview._id,
      question,
      questionNumber: 1,
      totalQuestions: TOTAL_QUESTIONS,
      role,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Failed to start interview. Please try again.' });
  }
};

/**
 * Submit an answer and get AI evaluation
 * POST /api/interview/answer
 */
const submitAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId || answer === undefined) {
      return res.status(400).json({ message: 'Interview ID and answer are required.' });
    }

    // Find the interview and verify ownership
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.user._id,
      status: 'in-progress',
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    // Get the current unanswered question (last in array)
    const currentQAIndex = interview.questionAnswers.length - 1;
    const currentQA = interview.questionAnswers[currentQAIndex];

    if (!currentQA) {
      return res.status(400).json({ message: 'No active question found.' });
    }

    // Get AI evaluation of the answer
    const evaluation = await evaluateAnswer(interview.role, currentQA.question, answer);

    // Update the Q&A with the answer and evaluation
    interview.questionAnswers[currentQAIndex].answer = answer;
    interview.questionAnswers[currentQAIndex].evaluation = evaluation;
    interview.questionAnswers[currentQAIndex].answeredAt = new Date();
    interview.markModified('questionAnswers');

    await interview.save();

    res.json({
      message: 'Answer evaluated!',
      evaluation,
      questionNumber: currentQAIndex + 1,
      totalAnswered: interview.questionAnswers.filter(qa => qa.answer).length,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Failed to evaluate answer. Please try again.' });
  }
};

/**
 * Get the next question (or complete the interview)
 * POST /api/interview/next
 */
const nextQuestion = async (req, res) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: 'Interview ID is required.' });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.user._id,
      status: 'in-progress',
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    const answeredCount = interview.questionAnswers.filter(qa => qa.answer).length;

    // Check if interview is complete
    if (answeredCount >= TOTAL_QUESTIONS) {
      // Mark as complete and compute summary scores
      const validEvals = interview.questionAnswers.filter(qa => qa.evaluation?.score);
      const avgScore = validEvals.length
        ? Math.round(validEvals.reduce((s, qa) => s + qa.evaluation.score, 0) / validEvals.length)
        : 0;

      interview.status = 'completed';
      interview.overallScore = avgScore;
      interview.completedAt = new Date();
      await interview.save();

      // Update user stats
      const user = await User.findById(req.user._id);
      const newTotal = user.totalInterviews + 1;
      const newAvg = Math.round(((user.averageScore * user.totalInterviews) + avgScore) / newTotal);
      await User.findByIdAndUpdate(req.user._id, {
        totalInterviews: newTotal,
        averageScore: newAvg,
      });

      return res.json({
        completed: true,
        message: 'Interview completed!',
        interviewId: interview._id,
      });
    }

    // Generate the next question
    const questionNumber = answeredCount + 1;
    const previousQuestions = interview.questionAnswers.map(qa => qa.question);
    const isFollowUp = answeredCount % FOLLOW_UP_INTERVAL === 0 && answeredCount > 0;

    let nextQuestionText;
    if (isFollowUp) {
      // Generate a contextual follow-up based on the last answer
      const lastQA = interview.questionAnswers[interview.questionAnswers.length - 1];
      nextQuestionText = await generateFollowUpQuestion(
        interview.role,
        lastQA.question,
        lastQA.answer
      );
    } else {
      nextQuestionText = await generateQuestion(interview.role, previousQuestions);
    }

    // Add the new question to the interview
    interview.questionAnswers.push({
      question: nextQuestionText,
      answer: '',
      isFollowUp,
      evaluation: {},
    });
    await interview.save();

    res.json({
      completed: false,
      question: nextQuestionText,
      questionNumber,
      totalQuestions: TOTAL_QUESTIONS,
      isFollowUp,
    });
  } catch (error) {
    console.error('Next question error:', error);
    res.status(500).json({ message: 'Failed to get next question. Please try again.' });
  }
};

/**
 * Get a specific interview's data
 * GET /api/interview/:id
 */
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found.' });
    }

    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Failed to fetch interview.' });
  }
};

module.exports = { startInterview, submitAnswer, nextQuestion, getInterview };
