/**
 * OpenAI Service
 * Handles all AI-powered interview interactions
 * Using Groq API with Llama models
 */
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Fast model — question generation
const FAST_MODEL = "llama3-8b-8192";

// Better model — evaluation & reports (more accurate)
const SMART_MODEL = "llama3-70b-8192";

/**
 * Generate an interview question for a given role
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
Return ONLY the question text, nothing else.${previousQuestionsText}`;

  try {
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    const question = response.choices[0].message.content.trim();

    // Safety check — agar empty ya bahut short aaye
    if (!question || question.length < 10) {
      return `What are the key concepts of ${role} that you use daily?`;
    }

    return question;
  } catch (error) {
    console.error("generateQuestion error:", error.message);
    return `Explain a core concept of ${role} with a practical example.`;
  }
};

/**
 * Generate a contextual follow-up question
 */
const generateFollowUpQuestion = async (
  role,
  previousQuestion,
  previousAnswer,
) => {
  const prompt = `Act as a senior technical interviewer for a ${role} position.

The candidate was asked: "${previousQuestion}"
Their answer was: "${previousAnswer}"

Generate ONE short, specific follow-up question that digs deeper into their answer.
Return ONLY the question text, nothing else.`;

  try {
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const question = response.choices[0].message.content.trim();

    if (!question || question.length < 10) {
      return `Can you elaborate more on that point?`;
    }

    return question;
  } catch (error) {
    console.error("generateFollowUpQuestion error:", error.message);
    return `Can you provide a specific example to support your answer?`;
  }
};

/**
 * Evaluate a candidate's answer
 */
const evaluateAnswer = async (role, question, answer) => {
  // Handle empty answer
  if (!answer || answer.trim().length < 3) {
    return {
      score: 0,
      grammar_feedback: "No answer was provided.",
      technical_feedback: "No answer was provided to evaluate.",
      confidence_feedback: "Unable to assess without an answer.",
      strengths: [],
      weaknesses: ["No answer provided"],
      suggestions: ["Please provide a detailed answer."],
    };
  }

  const prompt = `You are an expert technical interviewer evaluating a ${role} candidate.

Question: "${question}"
Candidate Answer: "${answer}"

Evaluate and return ONLY this exact JSON (no extra text, no markdown):
{
  "score": <number 0-100>,
  "grammar_feedback": "<2-3 sentences about communication clarity>",
  "technical_feedback": "<3-4 sentences about technical accuracy>",
  "confidence_feedback": "<2-3 sentences about confidence and structure>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content.trim();
    const cleanContent = content.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanContent);

      // Validate required fields exist
      return {
        score: parsed.score || 50,
        grammar_feedback: parsed.grammar_feedback || "Could not evaluate.",
        technical_feedback: parsed.technical_feedback || "Could not evaluate.",
        confidence_feedback:
          parsed.confidence_feedback || "Could not evaluate.",
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (parseError) {
      console.error("JSON Parse Error in evaluateAnswer:", parseError.message);
      return {
        score: 50,
        grammar_feedback: "Evaluation parsing error. Please try again.",
        technical_feedback: "Evaluation parsing error. Please try again.",
        confidence_feedback: "Evaluation parsing error. Please try again.",
        strengths: ["Answer was provided"],
        weaknesses: ["Could not fully evaluate"],
        suggestions: ["Try submitting your answer again"],
      };
    }
  } catch (error) {
    console.error("evaluateAnswer error:", error.message);
    return {
      score: 50,
      grammar_feedback: "Evaluation service error.",
      technical_feedback: "Evaluation service error.",
      confidence_feedback: "Evaluation service error.",
      strengths: [],
      weaknesses: ["AI evaluation failed"],
      suggestions: ["Please try again"],
    };
  }
};

/**
 * Generate comprehensive end-of-interview report
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

  const prompt = `You are summarizing a complete mock interview for a ${role} position.

Interview data:
${JSON.stringify(summaryData, null, 2)}

Overall average score: ${avgScore}/100

Return ONLY this exact JSON (no markdown, no extra text):
{
  "technicalScore": <0-100>,
  "grammarScore": <0-100>,
  "confidenceScore": <0-100>,
  "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
    });

    const content = response.choices[0].message.content.trim();
    const cleanContent = content.replace(/```json|```/g, "").trim();

    try {
      const reportData = JSON.parse(cleanContent);
      return {
        overallScore: avgScore,
        technicalScore: reportData.technicalScore || avgScore,
        grammarScore: reportData.grammarScore || avgScore,
        confidenceScore: reportData.confidenceScore || avgScore,
        strengths: reportData.strengths || [],
        weaknesses: reportData.weaknesses || [],
        suggestions: reportData.suggestions || [],
      };
    } catch (parseError) {
      console.error(
        "JSON Parse Error in generateFinalReport:",
        parseError.message,
      );
      return {
        overallScore: avgScore,
        technicalScore: avgScore,
        grammarScore: avgScore,
        confidenceScore: avgScore,
        strengths: ["Completed the interview"],
        weaknesses: ["Report generation had parsing issues"],
        suggestions: ["Review individual question feedback for details"],
      };
    }
  } catch (error) {
    console.error("generateFinalReport error:", error.message);
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
