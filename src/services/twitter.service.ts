import { TwitterApi } from 'twitter-api-v2';
import { twitterConfig } from '../config/twitter.config';
import { Tweet, TwitterSearchParams } from '../interfaces/twitter.interface';
import { logger } from '../utils/logger';

export class TwitterService {
  private readonly client: TwitterApi;
  private readonly authenticatedClient: TwitterApi;
  private readonly maxRetries = 3;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval = 5000; // 5 seconds between requests

  constructor() {
    this.client = new TwitterApi(twitterConfig.bearerToken);
    this.authenticatedClient = new TwitterApi({
      appKey: twitterConfig.apiKey,
      appSecret: twitterConfig.apiSecret,
      accessToken: twitterConfig.accessToken,
      accessSecret: twitterConfig.accessTokenSecret,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForRateLimit(error: any): Promise<void> {
    if (error.rateLimit) {
      const resetTime = error.rateLimit.reset * 1000; // Convert to milliseconds
      const now = Date.now();
      const waitTime = Math.max(resetTime - now, this.minRequestInterval);
      
      logger.warn(`Rate limited. Waiting ${Math.ceil(waitTime/1000)} seconds for rate limit reset`);
      await this.sleep(waitTime);
    } else {
      // If no rate limit info, use default wait time
      await this.sleep(this.minRequestInterval);
    }
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  async searchTweets(params: TwitterSearchParams, retryCount = 0): Promise<Tweet[]> {
    try {
      await this.throttleRequest();

      const { query, maxResults = 10 } = params;
      const searchQuery = `${query} -is:retweet lang:en`;
      
      const response = await this.client.v2.search(searchQuery, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id'],
        'sort_order': 'recency'
      });

      if (!response?.data?.data) {
        logger.warn('No tweets found');
        return [];
      }

      return response.data.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author: tweet.author_id || 'unknown',
        createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
        keywords: this.extractKeywords(tweet.text),
      }));

    } catch (error: any) {
      if (error.code === 429 && retryCount < this.maxRetries) {
        await this.waitForRateLimit(error);
        return this.searchTweets(params, retryCount + 1);
      }

      logger.error('Error searching tweets:', error);
      throw error;
    }
  }

  async postTweet(text: string): Promise<Tweet> {
    try {
      const response = await this.authenticatedClient.v2.tweet(text);
      
      return {
        id: response.data.id,
        text: response.data.text,
        author: 'self', // Since we're posting it
        createdAt: new Date(),
        keywords: this.extractKeywords(response.data.text),
      };
    } catch (error) {
      logger.error('Error posting tweet:', error);
      throw error;
    }
  }

  private extractKeywords(text: string): string[] {
    // Simplified keyword extraction - just hashtags
    const hashtags = text.toLowerCase().match(/#\w+/g) || [];
    return hashtags.map(tag => tag.replace('#', ''));
  }
}