import dotenv from 'dotenv';
import { TwitterService } from './services/twitter.service';
import { DeepseekService } from './services/deepseek.service';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  try {
    const twitterService = new TwitterService();
    const deepseekService = new DeepseekService();
    
    logger.info('Starting Twitter search...');
    
    const tweets = await twitterService.searchTweets({
      query: '#sonic',
      maxResults: 10
    });

    logger.info(`Found ${tweets.length} tweets\n`);

    // Analyze each tweet
    for (const tweet of tweets) {
      logger.info(`Analyzing tweet: ${tweet.text}\n`);
      
      const sentiment = await deepseekService.analyzeSentiment(tweet.text);
      
      logger.info('Analysis Results:');
      logger.info(`Sentiment: ${sentiment.sentiment}`);
      logger.info(`Score: ${sentiment.score}`);
      logger.info(`Keywords: ${sentiment.keywords.join(', ')}`);
      logger.info(`Summary: ${sentiment.summary}`);
      logger.info('---\n');
    }

  } catch (error) {
    logger.error('Application error:', error);
  }
}

main();