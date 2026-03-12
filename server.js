import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json({ limit: '1mb' }));

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const getAI = () => new GoogleGenAI({ apiKey });

const ensureApiKey = (res) => {
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    return false;
  }
  return true;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/philosopher', async (req, res) => {
  if (!ensureApiKey(res)) return;
  const philosopherName = String(req.body?.philosopherName || '').trim();
  if (!philosopherName) {
    res.status(400).json({ error: 'philosopherName is required' });
    return;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Give me a famous thinker named "${philosopherName}" or pick a random profound one if the name is generic. Provide:
      1. Their full name
      2. Birth/death dates
      3. Exactly 3 famous short quotes (each max 15 words)
      4. A brief one-sentence summary of their greatest achievements
      5. An array of 5 interesting, lesser-known facts about their life or philosophy.
      6. Their gender (Male or Female) to determine voice type.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'An array of 3 distinct quotes.',
            },
            dates: { type: Type.STRING },
            achievements: { type: Type.STRING },
            facts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            gender: { type: Type.STRING, description: 'Male or Female' },
          },
          required: ['name', 'quotes', 'dates', 'achievements', 'facts', 'gender'],
        },
      },
    });

    const text = response.text || '';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({ error: 'Invalid model response', raw: text });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate philosopher content' });
  }
});

app.post('/api/quote', async (req, res) => {
  if (!ensureApiKey(res)) return;
  const philosopherName = String(req.body?.philosopherName || '').trim();
  const existingQuotes = Array.isArray(req.body?.existingQuotes) ? req.body.existingQuotes : [];
  if (!philosopherName) {
    res.status(400).json({ error: 'philosopherName is required' });
    return;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide one more profound and famous quote by ${philosopherName} that is NOT in this list: [${existingQuotes.join(', ')}]. Keep it under 15 words. Return ONLY the quote text.`,
    });
    const quote = (response.text || '').trim().replace(/^["']|["']$/g, '');
    res.json({ quote });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate additional quote' });
  }
});

app.post('/api/portrait', async (req, res) => {
  if (!ensureApiKey(res)) return;
  const philosopherName = String(req.body?.philosopherName || '').trim();
  if (!philosopherName) {
    res.status(400).json({ error: 'philosopherName is required' });
    return;
  }

  try {
    const ai = getAI();
    const prompt = `A vibrant, full-frame cinematic oil painting portrait of ${philosopherName}. 19th-century master style, rich colors, heavy chiaroscuro lighting. COMPOSITION: Tight head-and-shoulders crop, eyes visible and expressive. NO BORDERS, NO PICTURE FRAMES, NO MATTES, NO MARGINS. The painting must fill every pixel to the very edge of the canvas. Deep textures, moody shadows, masterfully blended oil strokes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '3:4',
        },
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      res.status(502).json({ error: 'Failed to generate image data' });
      return;
    }

    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate portrait' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = Number(process.env.PORT) || 4173;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
