export interface SentimentAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    keywords: string[];
    summary: string;
  }