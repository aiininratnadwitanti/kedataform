import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

/**
 * Proxy pembuatan formulir/kuis dengan Gemini.
 * Dipakai baik oleh server lokal (server.ts) maupun Vercel Function (api/index.ts).
 */
export async function generateForm(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, isQuizRequested, questionCount } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in server environment');
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured in server environment' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Determine target question count from prompt if explicitly requested (e.g. "10 soal")
    const countMatch = prompt.match(/(\d+)\s*(soal|pertanyaan|butir|item|questions)/i);
    let targetCount = questionCount || (countMatch ? parseInt(countMatch[1], 10) : 5);
    if (isNaN(targetCount) || targetCount < 1) targetCount = 5;
    if (targetCount > 25) targetCount = 20;

    const pointsPerQuestion = Math.round(100 / targetCount);

    const systemInstruction = `
You are an expert curriculum designer and interactive form/quiz generator.
Generate a valid JSON object matching the FormSchema interface.

CRITICAL SUBJECT & TOPIC ACCURACY:
1. Every question MUST specifically match the subject, topic, and language requested by the user:
   - If the user asks for "Bahasa Inggris" or "English" (or grammar, vocabulary, tenses): ALL questions MUST be genuine English language questions (covering tenses, prepositions, vocabulary, idioms, sentence correction, and reading comprehension). Under NO circumstance should you return mathematics or physics when English is requested!
   - If the user asks for "Matematika", generate real math calculation problems.
   - If the user asks for "IPA" / science, generate natural science questions.
2. Target number of questions: exactly ${targetCount} questions.
3. If isQuiz is true:
   - quizConfig.isQuizMode = true
   - quizConfig.showScoreImmediately = true
   - quizConfig.passingScore = 75
   - Each question MUST have:
     - points: ${pointsPerQuestion}
     - correctAnswer: must match the exact "id" of the correct option (e.g. "opt_1", "opt_2", "opt_3", "opt_4").
     - explanation: clear, helpful explanation of why this answer is correct.
4. Clean Title Rules:
   - "title" property must be concise (e.g. "Kuis Bahasa Inggris", "Kuis Matematika Kelas 6 SD", "Form Pendaftaran Webinar").
   - Do NOT include command words like "buatkan", "tolong bikin", "di ai".
5. Question formatting:
   - Do NOT include question number prefixes like "1.", "Soal 1:", or "Q1:" in question titles.
   - For multiple choice, provide 4 plausible options with distinct text and clear unique IDs.

Output ONLY valid raw JSON matching FormSchema without markdown formatting or code blocks.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `User Prompt: "${prompt}". Mode Kuis: ${Boolean(isQuizRequested)}. Target Jumlah Soal: ${targetCount}.
Create a complete form or quiz with exactly ${targetCount} questions strictly matching the requested topic. If prompt mentions English / Bahasa Inggris, generate English questions only!`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    } catch (primaryErr: any) {
      console.warn('gemini-3.5-flash failed, attempting fallback to gemini-3-flash-preview:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Prompt: "${prompt}". Mode Kuis: ${Boolean(isQuizRequested)}. Target Jumlah Soal: ${targetCount}.
Create a complete form or quiz strictly matching the requested subject.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    }

    const text = response.text?.trim() || '';
    if (!text) {
      res.status(502).json({ error: 'Empty response from Gemini' });
      return;
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Error generating form with Gemini:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Failed to generate form' });
    }
  }
}
