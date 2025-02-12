import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { TwitterService } from './services/twitter.service';
import { DeepseekService } from './services/deepseek.service';
import { logger } from './utils/logger';
import { AxiosError } from 'axios';
import userRouter from './modules/user/user.router';
import { databaseService } from './services/database.service';
import { createServer } from 'http';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000'],  // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies if you're using them
  optionsSuccessStatus: 200
};

// Apply middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/users', userRouter);

// Ensure PORT is always a number
const PORT: number = parseInt(process.env.PORT || '5000', 10);
let server: any = null;

async function startServer(port: number): Promise<void> {
  try {
    server = createServer(app);
    
    return new Promise((resolve, reject) => {
      server.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        resolve();
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Port ${port} is busy, trying ${port + 1}`);
          server.close();
          startServer(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

async function main() {
  try {
    // Initialize database first
    await databaseService.connect();

    // Start server
    await startServer(PORT);

    const twitterService = new TwitterService();
    const deepseekService = new DeepseekService();
    
    logger.info('Starting Twitter search...');
    
    const tweets = await twitterService.searchTweets({
      query: '#sonic',
      maxResults: 10
    });

    logger.info(`Found ${tweets.length} tweets\n`);

    // Add rate limiting with delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const tweet of tweets) {
      try {
        logger.info(`Analyzing tweet: ${tweet.text}\n`);
        
        // Add retry logic for API calls
        let retries = 3;
        let sentiment = null;
        
        while (retries > 0 && !sentiment) {
          try {
            sentiment = await deepseekService.analyzeSentiment(tweet.text);
            break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await delay(1000); // Wait 1 second before retry
          }
        }
        
        if (sentiment) {
          logger.info('Analysis Results:');
          logger.info(`Sentiment: ${sentiment.sentiment}`);
          logger.info(`Score: ${sentiment.score}`);
          logger.info(`Keywords: ${sentiment.keywords.join(', ')}`);
          logger.info(`Summary: ${sentiment.summary}`);
        } else {
          logger.warn('No sentiment analysis results returned');
        }
        
        // Add longer delay between successful requests
        await delay(2000); // 2 seconds between API calls
        
      } catch (error) {
        if (error instanceof AxiosError) {
          logger.error(`Error analyzing tweet: ${error.message}`);
          if (error.response) {
            logger.error(`API Error Details: ${JSON.stringify(error.response.data)}`);
          }
        } else {
          logger.error(`Unexpected error analyzing tweet: ${String(error)}`);
        }
        continue;
      }
      logger.info('---\n');
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error('Application error:', error.message);
    } else {
      logger.error('Unknown application error:', String(error));
    }
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});