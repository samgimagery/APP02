
import { PhilosopherData } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || '';

const buildUrl = (path: string) => `${API_BASE}${path}`;

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchPhilosopherContent = async (philosopherName: string): Promise<PhilosopherData> => {
  return postJson<PhilosopherData>('/api/philosopher', { philosopherName });
};

export const fetchAdditionalQuote = async (philosopherName: string, existingQuotes: string[]): Promise<string> => {
  const data = await postJson<{ quote: string }>('/api/quote', { philosopherName, existingQuotes });
  return data.quote;
};

export const generatePhilosopherPortrait = async (philosopherName: string): Promise<string> => {
  const data = await postJson<{ imageUrl: string }>('/api/portrait', { philosopherName });
  return data.imageUrl;
};
