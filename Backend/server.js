require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const submissionRoutes = require("./routes/submissionRoutes"); 
const sessionRoutes = require("./routes/sessionRoutes"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in environment variables");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("......MongoDB connected........."))
  .catch((err) => console.error("MongoDB connection error:", err));

//routes
app.use("/api/users", userRoutes);
app.use("/api/submissions", submissionRoutes); 
app.use("/api/sessions", sessionRoutes); 

// ==========================================
// AI CONFIGURATION & HELPERS
// ==========================================
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_URL =
  process.env.GEMINI_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

async function callAI(prompt) {
  if (AI_PROVIDER === "groq") {
    if (!GROQ_API_KEY) {
      return "No response from AI";
    }

    const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2
        })
      }
    );

    const json = await response.json();
    if (!response.ok) return "No response from AI";
    return json.choices?.[0]?.message?.content || "No response from AI";
  }

  // Gemini Fallback
  if (!API_KEY) {
    return "No response from AI";
  }

  const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  const json = await response.json();
  if (!response.ok) return "No response from AI";
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
}

// ==========================================
// AI PROMPTS
// ==========================================
const DPROMPT = `
You are an expert competitive programming assistant.
Your task is to COMPLETE the user's existing LeetCode solution.
STRICT RULES:
1. Return ONLY the final source code inside a fenced markdown block.
2. Do NOT write any explanation before or after the code.
3. The code MUST compile successfully and pass all LeetCode test cases.
4. Preserve the programming language already used by the user.

Programming Language:
{language}
`;

const ASSISTANT_PROMPT = `
You are LeetBuddy AI, an expert competitive programming mentor.
Your job is to TEACH, not solve.
- Never reveal chain of thought.
- Always preserve the user's programming language.
- Keep answers structured with Markdown headings and bullet points.

Programming Language:
{language}
`;

const ALGORITHM_CLASSIFICATION_PROMPT = `You are an algorithm classification expert. Analyze the provided code and determine which algorithm topics from the list below are used. Return ONLY the topic names as a comma-separated list.
CODE TO ANALYZE:
`;

const COMPLEXITY_PROMPT = `You are an algorithm analysis assistant. Given a code snippet, respond ONLY with a valid JSON object describing its time and space complexity in Big-O notation like: {"timeComplexity":"O(...)", "spaceComplexity":"O(...)"}. Do not add commentary.`;

// ==========================================
// AI ROUTES
// ==========================================
app.post("/api/ask-ai", async (req, res) => {
  const { description, code } = req.body;
  if (!description || !code) return res.status(400).json({ error: "Missing description or code" });

  const fullPrompt = `${DPROMPT}\n📖 Problem:\n${description}\n💻 User Code:\n${code}`;
  try {
    let aiAnswer = await callAI(fullPrompt);
    aiAnswer = aiAnswer.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    res.json({ answer: aiAnswer });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/api/ai-assistant", async (req, res) => {
  const { message, code, description, language } = req.body;
  const wantsSolution = /^generate/i.test(message.trim());
  if (!message) return res.status(400).json({ error: "Message is required" });

  const contextInfo = [];
  if (description) contextInfo.push(`Problem Description:\n${description}`);
  if (language) contextInfo.push(`Programming Language:\n${language}`);
  if (code) contextInfo.push(`User's Current Code:\n${code}`);

  const fullPrompt = `
${wantsSolution ? DPROMPT : ASSISTANT_PROMPT}
${contextInfo.join("\n\n")}
User Question/Request:
${message}
`;

  try {
    let assistantResponse = await callAI(fullPrompt);
    res.json({ answer: assistantResponse.trim() });
  } catch (err) {
    console.error("AI Assistant error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/api/analyze-algorithm", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${ALGORITHM_CLASSIFICATION_PROMPT}\n${code}` }] }]
      })
    });
    const json = await response.json();
    let topics = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    topics = topics.trim().split(",").map(t => t.trim()).filter(t => t);
    res.json({ topics });
  } catch (err) {
    console.error("Algorithm analysis error:", err);
    res.status(500).json({ error: "Failed to analyze algorithm" });
  }
});

app.post("/api/analyze-complexity", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${COMPLEXITY_PROMPT}\n${code}` }] }]
      })
    });
    const json = await response.json();
    let content = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    content = content.replace(/```json|```/gi, "").trim();

    let parsed = { timeComplexity: "Unknown", spaceComplexity: "Unknown" };
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      const timeMatch = content.match(/time\s*complexity[:\-]?\s*(O[^,\n]+)/i);
      const spaceMatch = content.match(/space\s*complexity[:\-]?\s*(O[^,\n]+)/i);
      if (timeMatch) parsed.timeComplexity = timeMatch[1].trim();
      if (spaceMatch) parsed.spaceComplexity = spaceMatch[1].trim();
    }
    res.json(parsed);
  } catch (err) {
    console.error("Complexity analysis error:", err);
    res.status(500).json({ error: "Failed to analyze complexity" });
  }
});

// Basic health check route
app.get("/", (req, res) => {
  res.json({ message: "LeetBuddy API is running!" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});