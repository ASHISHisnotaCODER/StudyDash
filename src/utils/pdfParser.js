/**
 * pdfParser.js
 * Extracts subjects & topics from a syllabus PDF using pdfjs-dist and Google Gemini API.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker (avoids Vite bundling issues with WASM/workers)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// ── Colour palette for subjects ───────────────────────────────────────────────
const COLORS = [
  '#00f5ff', '#8b5cf6', '#f472b6', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
  '#fb923c', '#a78bfa', '#34d399', '#f87171',
];

const getColor = (idx) => COLORS[idx % COLORS.length];

export async function parseSyllabusPDF(file) {
  // 1. Extract raw text from PDF
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const maxPages = Math.min(pdf.numPages, 20); // Limit to 20 pages for much faster AI processing

  const pagePromises = Array.from({ length: maxPages }, async (_, i) => {
    const pageNum = i + 1;
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    return `\n--- PAGE ${pageNum} ---\n` + pageText;
  });

  const pagesText = await Promise.all(pagePromises);
  const fullText = pagesText.join('');

  // 2. Call Gemini API
  const prompt = `You are an expert academic syllabus parser.
I will provide you with the raw extracted text from a university syllabus PDF.
Your job is to identify all the distinct Subjects (or Courses/Papers) and their corresponding Topics (or Modules/Units).

RULES:
1. ONLY return valid JSON. Do not return markdown blocks, do not return explanations. Just the JSON array.
2. Ignore all boilerplate text, page numbers, university names, author names, examination schemes, textbooks, reference books, and general instructions.
3. The topics array should be a clean list of the actual things to study (like "Arrays", "Linked Lists", "Thermodynamics", etc.), without "Unit 1" prefixes.
4. The output must match this exact JSON schema:
[
  {
    "name": "Subject Name (e.g. Data Structures)",
    "topics": ["Topic 1", "Topic 2", "Topic 3"]
  }
]

RAW SYLLABUS TEXT:
${fullText.substring(0, 100000)}
`;

  try {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch from backend");
    }

    const parsedSubjects = await response.json();

    // 3. Format into the required StudyDash structure
    return parsedSubjects.map((s, idx) => {
        const cleanName = (s.name || "").trim();
        const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
            id: id || `subject-${idx}`,
            name: cleanName || `Unknown Subject ${idx+1}`,
            topics: Array.isArray(s.topics) ? s.topics.map(t => {
                if (typeof t === 'string') return { name: t.trim(), difficulty: 'Medium' };
                return { name: (t.name || "").trim(), difficulty: t.difficulty || 'Medium' };
            }).filter(t => t.name) : [{ name: "General Concepts", difficulty: "Medium" }],
            color: getColor(idx)
        };
    }).filter(s => s.topics.length > 0);

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error(error.message || "Failed to parse syllabus with AI. Please check your API key and try again.");
  }
}
