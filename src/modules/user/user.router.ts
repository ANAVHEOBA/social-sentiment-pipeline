import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));

// Protected routes - require authentication
router.post('/tokens', authMiddleware, (req, res) => userController.addToken(req, res));
router.get('/tokens', authMiddleware, (req, res) => userController.getTokens(req, res));
router.delete('/tokens', authMiddleware, (req, res) => userController.removeToken(req, res));

// Token boost endpoint
router.get('/token-boosts', authMiddleware, (req, res) => userController.getTokenBoosts(req, res));

// Add new endpoint for top token boosts
router.get('/token-boosts/top', authMiddleware, (req, res) => userController.getTopTokenBoosts(req, res));

// Add new endpoint for token orders
router.get('/orders/:chainId/:tokenAddress', authMiddleware, (req, res) => userController.getTokenOrders(req, res));

// Add new endpoint for pair information
router.get('/pairs/:chainId/:pairId', authMiddleware, (req, res) => userController.getPairInfo(req, res));

// Add new endpoint for pair search
router.get('/pairs/search', authMiddleware, (req, res) => userController.searchPairs(req, res));

// Add new endpoint for token pairs
router.get('/token-pairs/:chainId/:tokenAddress', authMiddleware, (req, res) => userController.getTokenPairs(req, res));

// Add new endpoint for multi-token pairs
router.get('/tokens/:chainId', authMiddleware, (req, res) => userController.getMultiTokenPairs(req, res));

export default router;
