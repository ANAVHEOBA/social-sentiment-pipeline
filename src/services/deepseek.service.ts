import axios from 'axios';
import { deepseekConfig } from '../config/deepseek.config';
import { logger } from '../utils/logger';
import { SentimentAnalysis } from '../interfaces/sentiment.interface';

export class DeepseekService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = deepseekConfig.apiKey;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-r1:free';
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const prompt = `
        Analyze the sentiment of the following text and provide a response in JSON format with the following fields:
        - sentiment: (positive, negative, or neutral)
        - score: (number between -1 and 1)
        - keywords: (array of important keywords)
        - summary: (brief explanation of the sentiment)

        Text to analyze: "${text}"

        Respond only with the JSON object, no additional text.
      `;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analysis expert. Provide analysis in JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      return JSON.parse(result);

    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      throw error;
    }
  }
}