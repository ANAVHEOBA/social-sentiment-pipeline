import dotenv from 'dotenv';

dotenv.config();

export const deepseekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || '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',
  model: 'deepseek-r1:free'
};