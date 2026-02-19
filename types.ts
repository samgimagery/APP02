
export interface PhilosopherData {
  name: string;
  quotes: string[];
  dates: string;
  achievements: string;
  facts: string[];
  gender: 'Male' | 'Female';
}

export interface GenerationResult {
  imageUrl: string;
  philosopher: string;
  quotes: string[];
  dates: string;
  achievements: string;
  facts: string[];
  gender: 'Male' | 'Female';
}

export interface AppState {
  loading: boolean;
  error: string | null;
  result: GenerationResult | null;
  currentQuoteIndex: number;
  statusMessage: string;
}
