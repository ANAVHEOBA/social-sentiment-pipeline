import dotenv from 'dotenv';

dotenv.config();

export const deepseekConfig = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: process.env.OPENROUTER_API_KEY || 'your-default-key',
  model: 'deepseek/deepseek-coder-33b-instruct',
  headers: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5000',
    'X-Title': process.env.SITE_NAME || 'Social Sentiment Pipeline',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'your-default-key'}`,
    'Content-Type': 'application/json'
  }
};