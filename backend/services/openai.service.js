/**
 * AI Service (Groq)
 * Handles all AI-powered interview interactions.
 * Env vars: GROQ_API_KEY (required)
 *           GROQ_MODEL_FAST / GROQ_MODEL_SMART (optional overrides)
 */
const OpenAI = require("openai");

// Models available on this Groq account (check with GET /openai/v1/models)
const FAST_MODEL = process.env.GROQ_MODEL_FAST || "openai/gpt-oss-20b";
const SMART_MODEL = process.env.GROQ_MODEL_SMART || "openai/gpt-oss-120b";

// Create the client lazily so a missing key gives a clear error, not a crash at startup
let client = null;
const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is missing. Add it in your environment variables.",
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
};

/** Call the model, retry once on failure, return trimmed text */
const chat = async (model, prompt, maxTokens, temperature, json = false) => {
  let lastError;
  const isReasoning = model.includes("gpt-oss");
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Attempt 1 uses JSON mode / low reasoning; attempt 2 is a plain call
      const extras =
        attempt === 1
          ? {
              ...(json ? { response_format: { type: "json_object" } } : {}),
              ...(isReasoning ? { reasoning_effort: "low" } : {}),
            }
          : {};
      const response = await getClient().chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        // reasoning models spend tokens on thinking, so give extra room
        max_tokens: isReasoning ? maxTokens * 4 : maxTokens,
        temperature,
        ...extras,
      });
      const text = response.choices?.[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error("Empty response from AI");
    } catch (error) {
      lastError = error;
      console.error(
        `AI call failed (model ${model}, attempt ${attempt}): status=${error.status || "n/a"} message=${error.message}`,
      );
    }
  }
  throw lastError;
};

/** Pull the first JSON object out of a model reply */
const parseJSON = (text) => {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.error("AI reply had no JSON:", text.slice(0, 300));
    throw new Error("No JSON found in AI reply");
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    console.error(
      "AI JSON parse failed:",
      e.message,
      "| reply:",
      text.slice(0, 300),
    );
    throw e;
  }
};

// Used only if the AI is unreachable, so the interview never breaks
const FALLBACK_QUESTIONS = [
  "Explain the difference between var, let and const in JavaScript.",
  "What is the Virtual DOM in React and why does it improve performance?",
  "How does the event loop work in Node.js?",
  "Explain how REST APIs work and the common HTTP methods.",
  "What is the difference between SQL and NoSQL databases?",
  "How do you handle authentication in a web application?",
  "What are closures in JavaScript? Give an example.",
  "Explain middleware in Express.js.",
];
const fallbackQuestion = (previousQuestions = []) => {
  const unused = FALLBACK_QUESTIONS.filter(
    (q) => !previousQuestions.includes(q),
  );
  const pool = unused.length ? unused : FALLBACK_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
};

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
Return ONLY the question text.${previousQuestionsText}`;

  try {
    return await chat(FAST_MODEL, prompt, 150, 0.8);
  } catch (error) {
    console.error("generateQuestion error:", error.message);
    return fallbackQuestion(previousQuestions);
  }
};

/**
 * Generate a contextual follow-up question based on the previous answer
 */
const generateFollowUpQuestion = async (
  role,
  previousQuestion,
  previousAnswer,
) => {
  const prompt = `Act as an interviewer for a ${role} position.
Question: ${previousQuestion}
Answer: ${previousAnswer}
Generate ONE follow-up question. Return ONLY the question text.`;

  try {
    return await chat(FAST_MODEL, prompt, 150, 0.7);
  } catch (error) {
    console.error("generateFollowUpQuestion error:", error.message);
    return fallbackQuestion([previousQuestion]);
  }
};

/**
 * Evaluate a candidate's answer
 */
const evaluateAnswer = async (role, question, answer) => {
  const prompt = `You are evaluating a ${role} candidate.

Question: "${question}"
Answer: "${answer}"

Return ONLY JSON in exactly this shape:
{
  "score": <number 0-100>,
  "grammar_feedback": "",
  "technical_feedback": "",
  "confidence_feedback": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}`;

  try {
    const content = await chat(SMART_MODEL, prompt, 600, 0.3, true);
    return parseJSON(content);
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
    const content = await chat(SMART_MODEL, prompt, 500, 0.4, true);
    return { overallScore: avgScore, ...parseJSON(content) };
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
