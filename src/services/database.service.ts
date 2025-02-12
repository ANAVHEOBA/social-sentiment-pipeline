import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://wisdomvolt:XsCnZwip4cATC5Ar@cluster0.b1hwv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
      
      await mongoose.connect(mongoUri);
      
      mongoose.connection.on('connected', () => {
        logger.info('Connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Disconnected from MongoDB');
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed through app termination');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const databaseService = DatabaseService.getInstance();
