import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
        [key: string]: any;
      };

      // Add user info to request object
      req.user = {
        id: decoded.userId
      };

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
