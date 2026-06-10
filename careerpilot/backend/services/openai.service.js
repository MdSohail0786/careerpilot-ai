/**
 * OpenAI Service
 * Handles all AI-powered interview interactions
 */

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an interview question for a given role
 * @param {string} role - The job role (e.g., "React Developer")
 * @param {Array} previousQuestions - Array of already-asked questions to avoid repeats
 * @returns {string} A single interview question
 */
const generateQuestion = async (role, previousQuestions = []) => {
  const previousQuestionsText = previousQuestions.length > 0
    ? `\n\nPrevious questions asked (do NOT repeat these):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `Act as a senior technical interviewer conducting a real interview for a ${role} position. 
Generate ONE clear, specific interview question that tests practical knowledge and problem-solving ability.
The question should be realistic and commonly asked in actual technical interviews.
Focus on: core concepts, practical application, problem-solving, or scenario-based questions.
Return ONLY the question text, nothing else - no numbering, no explanations, no quotation marks.${previousQuestionsText}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.8,
  });

  return response.choices[0].message.content.trim();
};

/**
 * Generate a contextual follow-up question based on the previous answer
 * @param {string} role - The job role
 * @param {string} previousQuestion - The question that was just answered
 * @param {string} previousAnswer - The candidate's answer
 * @returns {string} A follow-up question
 */
const generateFollowUpQuestion = async (role, previousQuestion, previousAnswer) => {
  const prompt = `Act as a senior technical interviewer for a ${role} position.

The candidate was asked: "${previousQuestion}"

Their answer was: "${previousAnswer}"

Generate ONE contextual follow-up question that:
1. Digs deeper into their answer or a concept they mentioned
2. Clarifies something vague they said, OR
3. Challenges them to think more deeply about the topic
4. Feels natural in a real interview conversation

Return ONLY the follow-up question, nothing else.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
};

/**
 * Evaluate a candidate's answer to an interview question
 * @param {string} role - The job role
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer
 * @returns {object} Structured evaluation with scores and feedback
 */
const evaluateAnswer = async (role, question, answer) => {
  // Handle empty or very short answers
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      grammar_feedback: 'No answer was provided.',
      technical_feedback: 'No answer was provided to evaluate.',
      confidence_feedback: 'Unable to assess confidence without an answer.',
      strengths: [],
      weaknesses: ['No answer provided'],
      suggestions: ['Please provide a detailed answer to receive proper feedback.'],
    };
  }

  const prompt = `You are an expert technical interviewer evaluating a candidate for a ${role} position.

Question: "${question}"

Candidate's Answer: "${answer}"

Evaluate this answer objectively and return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100 representing overall quality>,
  "grammar_feedback": "<2-3 sentences about grammar, clarity, and communication style>",
  "technical_feedback": "<3-4 sentences about technical accuracy, depth, and correctness>",
  "confidence_feedback": "<2-3 sentences about confidence, structure, and delivery>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"]
}

Scoring guide:
- 90-100: Exceptional, comprehensive, demonstrates expert-level knowledge
- 70-89: Good, covers key concepts with minor gaps
- 50-69: Adequate, shows basic understanding but lacks depth
- 30-49: Partial, significant gaps or inaccuracies
- 0-29: Poor, fundamentally incorrect or incomplete

Return ONLY the JSON, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.3, // Lower temperature for more consistent evaluation
  });

  const content = response.choices[0].message.content.trim();

  // Parse JSON response safely
  try {
    // Remove potential markdown code fences
    const cleanContent = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('Failed to parse OpenAI evaluation response:', content);
    // Return a safe fallback
    return {
      score: 50,
      grammar_feedback: 'Evaluation parsing error. Please try again.',
      technical_feedback: 'Evaluation parsing error. Please try again.',
      confidence_feedback: 'Evaluation parsing error. Please try again.',
      strengths: ['Answer was provided'],
      weaknesses: ['Could not fully evaluate'],
      suggestions: ['Please try submitting your answer again.'],
    };
  }
};

/**
 * Generate a comprehensive end-of-interview report
 * @param {string} role - The job role
 * @param {Array} questionAnswers - Array of {question, answer, evaluation} objects
 * @returns {object} Comprehensive report with aggregate scores and feedback
 */
const generateFinalReport = async (role, questionAnswers) => {
  // Calculate aggregate scores from individual evaluations
  const validEvaluations = questionAnswers.filter(qa => qa.evaluation && qa.evaluation.score > 0);

  if (validEvaluations.length === 0) {
    return {
      overallScore: 0,
      technicalScore: 0,
      grammarScore: 0,
      confidenceScore: 0,
      strengths: [],
      weaknesses: ['No answers were provided'],
      suggestions: ['Complete the interview questions to receive a report'],
    };
  }

  // Compute averages from individual scores
  const avgScore = Math.round(
    validEvaluations.reduce((sum, qa) => sum + (qa.evaluation.score || 0), 0) / validEvaluations.length
  );

  // Build a summary prompt for qualitative report generation
  const summaryData = validEvaluations.map((qa, i) => ({
    q: i + 1,
    score: qa.evaluation.score,
    strengths: qa.evaluation.strengths,
    weaknesses: qa.evaluation.weaknesses,
  }));

  const prompt = `You are a senior technical interviewer summarizing a complete mock interview for a ${role} position.

Interview Summary (${validEvaluations.length} questions answered):
${JSON.stringify(summaryData, null, 2)}

Overall average score: ${avgScore}/100

Generate a comprehensive interview report. Return ONLY valid JSON:
{
  "technicalScore": <0-100, weighted average of technical performance>,
  "grammarScore": <0-100, weighted average of communication quality>,
  "confidenceScore": <0-100, estimate based on answer clarity and structure>,
  "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>", "<top strength 4>"],
  "weaknesses": ["<main weakness 1>", "<main weakness 2>", "<main weakness 3>"],
  "suggestions": ["<specific actionable suggestion 1>", "<specific actionable suggestion 2>", "<specific actionable suggestion 3>", "<specific actionable suggestion 4>"]
}

Return ONLY the JSON, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.4,
  });

  const content = response.choices[0].message.content.trim();

  try {
    const cleanContent = content.replace(/```json|```/g, '').trim();
    const reportData = JSON.parse(cleanContent);
    return {
      overallScore: avgScore,
      ...reportData,
    };
  } catch (parseError) {
    console.error('Failed to parse final report response:', content);
    return {
      overallScore: avgScore,
      technicalScore: avgScore,
      grammarScore: avgScore,
      confidenceScore: avgScore,
      strengths: ['Completed the interview'],
      weaknesses: ['Report generation error'],
      suggestions: ['Review individual question feedback for detailed insights'],
    };
  }
};

module.exports = {
  generateQuestion,
  generateFollowUpQuestion,
  evaluateAnswer,
  generateFinalReport,
};
