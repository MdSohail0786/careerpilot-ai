/**
 * OpenAI Service
 * Handles all AI-powered interview interactions
 */
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Generate an interview question for a given role
 * @param {string} role - The job role (e.g., "React Developer")
 * @param {Array} previousQuestions - Array of already-asked questions to avoid repeats
 * @returns {string} A single interview question
 */
const generateQuestion = async (role, previousQuestions = []) => {
  const previousQuestionsText =
    previousQuestions.length > 0
      ? `\n\nPrevious questions asked (do NOT repeat these):\n${previousQuestions
          .slice(-5)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  const prompt = `Act as a senior technical interviewer conducting a real interview for a ${role} position. 
Generate ONE clear, specific interview question that tests practical knowledge and problem-solving ability.
Return ONLY the question text.${previousQuestionsText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("generateQuestion error:", error.message);
    return "Unable to generate question right now.";
  }
};

/**
 * Generate a contextual follow-up question based on the previous answer
 * @param {string} role - The job role
 * @param {string} previousQuestion - The question that was just answered
 * @param {string} previousAnswer - The candidate's answer
 * @returns {string} A follow-up question
 */
const generateFollowUpQuestion = async (
  role,
  previousQuestion,
  previousAnswer,
) => {
  const prompt = `Act as interviewer for ${role}.
Question: ${previousQuestion}
Answer: ${previousAnswer}
Generate ONE follow-up question.`;

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Error (followUp):", error.message);
    return "Unable to generate follow-up question.";
  }
};
/**
 * Evaluate a candidate's answer to an interview question
 * @param {string} role - The job role
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer
 * @returns {object} Structured evaluation with scores and feedback
 */
const evaluateAnswer = async (role, question, answer) => {
  const prompt = `You are evaluating a ${role} candidate.

Question: "${question}"
Answer: "${answer}"

Return ONLY JSON:
{
  "score": 0-100,
  "grammar_feedback": "",
  "technical_feedback": "",
  "confidence_feedback": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content.trim();
    //const content = response.choices[0].message.content.trim();

    const cleanContent = content.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("JSON Parse Error:", cleanContent);

      return {
        score: 50,
        grammar_feedback: "Parsing error",
        technical_feedback: "Parsing error",
        confidence_feedback: "Parsing error",
        strengths: [],
        weaknesses: ["Invalid AI response"],
        suggestions: ["Try again"],
      };
    }
  } catch (error) {
    console.error("evaluateAnswer error:", error.message);

    return {
      score: 50,
      grammar_feedback: "Evaluation failed",
      technical_feedback: "Evaluation failed",
      confidence_feedback: "Evaluation failed",
      strengths: [],
      weaknesses: ["AI error"],
      suggestions: ["Try again"],
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
  const validEvaluations = questionAnswers.filter(
    (qa) => qa.evaluation && qa.evaluation.score > 0,
  );

  if (validEvaluations.length === 0) {
    return {
      overallScore: 0,
      technicalScore: 0,
      grammarScore: 0,
      confidenceScore: 0,
      strengths: [],
      weaknesses: ["No answers were provided"],
      suggestions: ["Complete the interview questions to receive a report"],
    };
  }

  const avgScore = Math.round(
    validEvaluations.reduce((sum, qa) => sum + (qa.evaluation.score || 0), 0) /
      validEvaluations.length,
  );

  const summaryData = validEvaluations.map((qa, i) => ({
    q: i + 1,
    score: qa.evaluation.score,
    strengths: qa.evaluation.strengths,
    weaknesses: qa.evaluation.weaknesses,
  }));

  const prompt = `You are a senior technical interviewer summarizing a complete mock interview for a ${role} position.

Interview Summary:
${JSON.stringify(summaryData, null, 2)}

Overall average score: ${avgScore}/100

Return ONLY valid JSON:
{
  "technicalScore": <0-100>,
  "grammarScore": <0-100>,
  "confidenceScore": <0-100>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
    });

    const content = response.choices[0].message.content.trim();

    const cleanContent = content.replace(/```json|```/g, "").trim();
    const reportData = JSON.parse(cleanContent);

    return {
      overallScore: avgScore,
      ...reportData,
    };
  } catch (error) {
    console.error("OpenAI Error (generateFinalReport):", error.message);

    return {
      overallScore: avgScore,
      technicalScore: avgScore,
      grammarScore: avgScore,
      confidenceScore: avgScore,
      strengths: ["Completed the interview"],
      weaknesses: ["Report generation failed"],
      suggestions: ["Try again"],
    };
  }
};
module.exports = {
  generateQuestion,
  generateFollowUpQuestion,
  evaluateAnswer,
  generateFinalReport,
};
