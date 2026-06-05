import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: "Server is missing GEMINI_API_KEY in .env file." });
    }

    const prompt = `You are an expert academic syllabus parser.
I will provide you with the raw extracted text from a university syllabus PDF.
Your job is to identify all the distinct Subjects (or Courses/Papers) and their corresponding Topics (or Modules/Units).

RULES:
1. ONLY return valid JSON. Do not return markdown blocks, do not return explanations. Just the JSON array.
2. Ignore all boilerplate text, page numbers, university names, author names, examination schemes, textbooks, reference books, and general instructions.
3. The topics array should be a clean list of the actual things to study (like "Arrays", "Linked Lists").
4. For each topic, intelligently estimate its academic difficulty level based on its context. Assign either "Easy", "Medium", or "Hard".
5. The output must match this exact JSON schema:
[
  {
    "name": "Subject Name (e.g. Data Structures)",
    "topics": [
      { "name": "Topic 1 (e.g. Arrays)", "difficulty": "Easy" },
      { "name": "Topic 2 (e.g. Red-Black Trees)", "difficulty": "Hard" }
    ]
  }
]

RAW SYLLABUS TEXT:
${text.substring(0, 100000)}`;

    console.log("Analyzing syllabus with Gemini... (This can take 15-30 seconds)");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to fetch from Gemini");
    }

    const data = await response.json();
    const textOutput = data.candidates[0].content.parts[0].text;
    
    // Validate it's parseable JSON before sending back
    let cleanJSON = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedSubjects = JSON.parse(cleanJSON);

    console.log("Successfully parsed syllabus!");
    res.json(parsedSubjects);
  } catch (error) {
    console.error("Backend Parsing Error:", error);
    res.status(500).json({ error: error.message || "Failed to parse syllabus." });
  }
});

app.listen(PORT, () => {
  console.log(`StudyDash Backend running on http://localhost:${PORT}`);
});
