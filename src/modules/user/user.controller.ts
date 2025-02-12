import { Request, Response } from 'express';
import { UserCrud } from './user.crud';
import { logger } from '../../utils/logger';
import { AnalysisService, TradingPair } from '../../services/analysis.service';

export class UserController {
  private userCrud: UserCrud;
  private analysisService: AnalysisService;

  constructor() {
    this.userCrud = new UserCrud();
    this.analysisService = new AnalysisService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userCrud.register(req.body);
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await this.userCrud.login(req.body);
      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  async addToken(req: Request, res: Response): Promise<void> {
    try {
      const { chainId, tokenAddress } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const user = await this.userCrud.addTokenToWatchlist(userId, chainId, tokenAddress);
      
      res.status(200).json({
        success: true,
        data: user.watchedTokens
      });
    } catch (error) {
      logger.error('Add token error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add token'
      });
    }
  }

  async getTokens(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chain, limit = 10, search } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const tokens = await this.userCrud.getTokenProfiles(userId);
      
      // Filter and format the response
      let filteredTokens = tokens;

      // Filter by chain if specified
      if (chain) {
        filteredTokens = filteredTokens.filter(token => 
          token.chainId.toLowerCase() === chain.toString().toLowerCase()
        );
      }

      // Filter by search term if specified
      if (search) {
        filteredTokens = filteredTokens.filter(token => 
          token.description?.toLowerCase().includes(search.toString().toLowerCase()) ||
          token.tokenAddress.toLowerCase().includes(search.toString().toLowerCase())
        );
      }

      // Limit the number of results
      filteredTokens = filteredTokens.slice(0, Number(limit));

      // Format the response
      const formattedTokens = filteredTokens.map(token => ({
        chainId: token.chainId,
        tokenAddress: token.tokenAddress,
        name: token.description?.split('\n')[0] || 'Unknown',
        icon: token.icon,
        url: token.url,
        links: token.links,
        description: token.description
      }));

      res.status(200).json({
        success: true,
        data: {
          total: tokens.length,
          filtered: filteredTokens.length,
          tokens: formattedTokens
        }
      });

    } catch (error) {
      logger.error('Get tokens error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tokens'
      });
    }
  }

  async removeToken(req: Request, res: Response): Promise<void> {
    try {
      const { chainId, tokenAddress } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const user = await this.userCrud.removeTokenFromWatchlist(userId, chainId, tokenAddress);
      
      res.status(200).json({
        success: true,
        data: user.watchedTokens
      });
    } catch (error) {
      logger.error('Remove token error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove token'
      });
    }
  }

  async getTokenBoosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chain, limit = 10, minAmount } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const boosts = await this.userCrud.getTokenBoosts();
      
      // Filter and format the response
      let filteredBoosts = boosts;

      // Filter by chain if specified
      if (chain) {
        filteredBoosts = filteredBoosts.filter(boost => 
          boost.chainId.toLowerCase() === chain.toString().toLowerCase()
        );
      }

      // Filter by minimum amount if specified
      if (minAmount) {
        filteredBoosts = filteredBoosts.filter(boost => 
          boost.amount >= Number(minAmount)
        );
      }

      // Limit the number of results
      filteredBoosts = filteredBoosts.slice(0, Number(limit));

      // Format the response
      const formattedBoosts = filteredBoosts.map(boost => ({
        chainId: boost.chainId,
        tokenAddress: boost.tokenAddress,
        amount: boost.amount,
        totalAmount: boost.totalAmount,
        name: boost.description?.split('\n')[0] || 'Unknown',
        icon: boost.icon,
        url: boost.url,
        links: boost.links,
        description: boost.description
      }));

      res.status(200).json({
        success: true,
        data: {
          total: boosts.length,
          filtered: filteredBoosts.length,
          boosts: formattedBoosts
        }
      });

    } catch (error) {
      logger.error('Get token boosts error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token boosts'
      });
    }
  }

  async getTopTokenBoosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chain, limit = 10, minTotalAmount } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const topBoosts = await this.userCrud.getTopTokenBoosts();
      
      // Filter and format the response
      let filteredBoosts = topBoosts;

      // Filter by chain if specified
      if (chain) {
        filteredBoosts = filteredBoosts.filter(boost => 
          boost.chainId.toLowerCase() === chain.toString().toLowerCase()
        );
      }

      // Filter by minimum total amount if specified
      if (minTotalAmount) {
        filteredBoosts = filteredBoosts.filter(boost => 
          boost.totalAmount >= Number(minTotalAmount)
        );
      }

      // Sort by totalAmount in descending order
      filteredBoosts.sort((a, b) => b.totalAmount - a.totalAmount);

      // Limit the number of results
      filteredBoosts = filteredBoosts.slice(0, Number(limit));

      // Format the response
      const formattedBoosts = filteredBoosts.map(boost => ({
        chainId: boost.chainId,
        tokenAddress: boost.tokenAddress,
        amount: boost.amount,
        totalAmount: boost.totalAmount,
        name: boost.description?.split('\n')[0] || 'Unknown',
        icon: boost.icon,
        url: boost.url,
        links: boost.links,
        description: boost.description,
        rank: filteredBoosts.indexOf(boost) + 1 // Add ranking position
      }));

      res.status(200).json({
        success: true,
        data: {
          total: topBoosts.length,
          filtered: filteredBoosts.length,
          boosts: formattedBoosts
        }
      });

    } catch (error) {
      logger.error('Get top token boosts error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get top token boosts'
      });
    }
  }

  async getTokenOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chainId, tokenAddress } = req.params;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!chainId || !tokenAddress) {
        res.status(400).json({
          success: false,
          error: 'Chain ID and token address are required'
        });
        return;
      }

      const orders = await this.userCrud.getTokenOrders({ chainId, tokenAddress });
      
      // Filter by status if specified
      let filteredOrders = orders;
      if (status) {
        filteredOrders = orders.filter(order => 
          order.status.toLowerCase() === status.toString().toLowerCase()
        );
      }

      // Sort by payment timestamp in descending order
      filteredOrders.sort((a, b) => b.paymentTimestamp - a.paymentTimestamp);

      // Format the response
      const formattedOrders = filteredOrders.map(order => ({
        ...order,
        paymentDate: new Date(order.paymentTimestamp).toISOString(),
        age: Math.floor((Date.now() - order.paymentTimestamp) / 1000) // age in seconds
      }));

      res.status(200).json({
        success: true,
        data: {
          chainId,
          tokenAddress,
          total: orders.length,
          filtered: filteredOrders.length,
          orders: formattedOrders
        }
      });

    } catch (error) {
      logger.error('Get token orders error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token orders'
      });
    }
  }

  async getPairInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chainId, pairId } = req.params;
      const { minLiquidity, minVolume24h } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!chainId || !pairId) {
        res.status(400).json({
          success: false,
          error: 'Chain ID and pair ID are required'
        });
        return;
      }

      const pairsData = await this.userCrud.getPairInfo(chainId, pairId);
      
      // Check if pairsData and pairs array exist
      if (!pairsData || !pairsData.pairs) {
        res.status(200).json({
          success: true,
          data: {
            schemaVersion: pairsData?.schemaVersion || '1.0.0',
            chainId,
            pairId,
            total: 0,
            filtered: 0,
            pairs: []
          }
        });
        return;
      }

      // Filter pairs based on criteria
      let filteredPairs = pairsData.pairs;

      if (minLiquidity) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.liquidity?.usd >= Number(minLiquidity)
        );
      }

      if (minVolume24h) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.volume?.['24h'] >= Number(minVolume24h)
        );
      }

      // Format the response with null checks
      const formattedPairs = filteredPairs.map(pair => ({
        chainId: pair.chainId,
        dexId: pair.dexId,
        url: pair.url,
        pairAddress: pair.pairAddress,
        labels: pair.labels || [],
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
        age: pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 1000) : null,
        metrics: {
          price: {
            usd: pair.priceUsd || '0',
            native: pair.priceNative || '0',
            change24h: pair.priceChange?.['24h'] || 0
          },
          volume24h: pair.volume?.['24h'] || 0,
          liquidity: pair.liquidity || { usd: 0, base: 0, quote: 0 },
          marketCap: pair.marketCap || 0,
          fdv: pair.fdv || 0
        },
        transactions24h: pair.txns?.['24h'] || { buys: 0, sells: 0 },
        info: pair.info || null,
        boosts: pair.boosts || { active: 0 }
      }));

      res.status(200).json({
        success: true,
        data: {
          schemaVersion: pairsData.schemaVersion,
          chainId,
          pairId,
          total: pairsData.pairs.length,
          filtered: filteredPairs.length,
          pairs: formattedPairs
        }
      });

    } catch (error) {
      logger.error('Get pair info error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pair information'
      });
    }
  }

  async searchPairs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { q, chain, minLiquidity, minVolume24h, limit = 100 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!q) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const pairsData = await this.userCrud.searchPairs(q.toString());
      
      // Check if pairsData and pairs array exist
      if (!pairsData || !pairsData.pairs) {
        res.status(200).json({
          success: true,
          data: {
            schemaVersion: pairsData?.schemaVersion || '1.0.0',
            query: q,
            total: 0,
            filtered: 0,
            pairs: []
          }
        });
        return;
      }

      // Filter pairs based on criteria
      let filteredPairs = pairsData.pairs;

      // Filter by chain if specified
      if (chain) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.chainId.toLowerCase() === chain.toString().toLowerCase()
        );
      }

      // Filter by minimum liquidity
      if (minLiquidity) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.liquidity?.usd >= Number(minLiquidity)
        );
      }

      // Filter by minimum 24h volume
      if (minVolume24h) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.volume?.['24h'] >= Number(minVolume24h)
        );
      }

      // Sort by liquidity (highest first)
      filteredPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

      // Apply limit
      filteredPairs = filteredPairs.slice(0, Number(limit));

      // Format the response with null checks
      const formattedPairs = filteredPairs.map(pair => ({
        chainId: pair.chainId,
        dexId: pair.dexId,
        url: pair.url,
        pairAddress: pair.pairAddress,
        labels: pair.labels || [],
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
        age: pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 1000) : null,
        metrics: {
          price: {
            usd: pair.priceUsd || '0',
            native: pair.priceNative || '0',
            change24h: pair.priceChange?.['24h'] || 0
          },
          volume24h: pair.volume?.['24h'] || 0,
          liquidity: pair.liquidity || { usd: 0, base: 0, quote: 0 },
          marketCap: pair.marketCap || 0,
          fdv: pair.fdv || 0
        },
        transactions24h: pair.txns?.['24h'] || { buys: 0, sells: 0 },
        info: pair.info || null,
        boosts: pair.boosts || { active: 0 }
      }));

      res.status(200).json({
        success: true,
        data: {
          schemaVersion: pairsData.schemaVersion,
          query: q,
          total: pairsData.pairs.length,
          filtered: filteredPairs.length,
          pairs: formattedPairs
        }
      });

    } catch (error) {
      logger.error('Search pairs error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search pairs'
      });
    }
  }

  async getTokenPairs(req: Request, res: Response): Promise<void> {
    try {
      const { chainId, tokenAddress } = req.params;
      const result = await this.userCrud.getTokenPairs(chainId, tokenAddress);
  
      // If we have no pairs but no error occurred
      if (result.pairData.pairs.length === 0) {
        res.status(200).json({
          success: true,
          data: result,
          message: 'No pairs found for this token'
        });
        return;
      }
  
      // Add type annotation for pair parameter
      const basicAnalysis = result.pairData.pairs.map((pair: TradingPair) => ({
        scores: {
          volume: Math.min(Math.log10(pair.volume?.h24 || 1) * 10, 100),
          liquidity: Math.min(Math.log10(pair.liquidity?.usd || 1) * 10, 100),
          price: Math.min(Math.max(50 + ((pair.priceChange?.h24 || 0) * 2), 0), 100),
          risk: 50, // Default risk score
          overall: 50 // Default overall score
        },
        pairAddress: pair.pairAddress || '',
        dexId: pair.dexId || '',
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        recommendation: 'HOLD', // Default recommendation
        explanation: 'Basic analysis based on available metrics'
      }));
  
      res.status(200).json({
        success: true,
        data: {
          pairData: {
            pairs: result.pairData.pairs,
            total: result.pairData.total,
            chainId,
            tokenAddress
          },
          analysis: {
            individualAnalyses: basicAnalysis,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      });
  
    } catch (error) {
      logger.error('Get token pairs error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token pairs'
      });
    }
  }

  async getMultiTokenPairs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chainId } = req.params;
      const { tokens, dex, minLiquidity, minVolume24h, sortBy = 'liquidity', limit = 100 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!chainId || !tokens) {
        res.status(400).json({
          success: false,
          error: 'Chain ID and token addresses are required'
        });
        return;
      }

      // Parse and validate token addresses
      const tokenAddresses = tokens.toString().split(',').map(addr => addr.trim());
      
      if (tokenAddresses.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one token address is required'
        });
        return;
      }

      if (tokenAddresses.length > 30) {
        res.status(400).json({
          success: false,
          error: 'Maximum of 30 token addresses allowed'
        });
        return;
      }

      const pairs = await this.userCrud.getMultiTokenPairs(chainId, tokenAddresses);
      
      // Check if pairs array exists
      if (!pairs) {
        res.status(200).json({
          success: true,
          data: {
            chainId,
            tokenAddresses,
            total: 0,
            filtered: 0,
            pairs: []
          }
        });
        return;
      }

      // Filter pairs based on criteria
      let filteredPairs = [...pairs];

      // Filter by DEX if specified
      if (dex) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.dexId.toLowerCase() === dex.toString().toLowerCase()
        );
      }

      // Filter by minimum liquidity
      if (minLiquidity) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.liquidity?.usd >= Number(minLiquidity)
        );
      }

      // Filter by minimum 24h volume
      if (minVolume24h) {
        filteredPairs = filteredPairs.filter(pair => 
          pair.volume?.['24h'] >= Number(minVolume24h)
        );
      }

      // Sort pairs based on sortBy parameter
      switch(sortBy.toString().toLowerCase()) {
        case 'volume':
          filteredPairs.sort((a, b) => (b.volume?.['24h'] || 0) - (a.volume?.['24h'] || 0));
          break;
        case 'price':
          filteredPairs.sort((a, b) => Number(b.priceUsd || 0) - Number(a.priceUsd || 0));
          break;
        case 'marketcap':
          filteredPairs.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
          break;
        case 'created':
          filteredPairs.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
          break;
        default: // 'liquidity'
          filteredPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      }

      // Apply limit
      filteredPairs = filteredPairs.slice(0, Number(limit));

      // Group pairs by token address
      const pairsByToken = filteredPairs.reduce((acc, pair) => {
        const tokenAddress = pair.baseToken.address;
        if (!acc[tokenAddress]) {
          acc[tokenAddress] = [];
        }
        acc[tokenAddress].push({
          dexId: pair.dexId,
          url: pair.url,
          pairAddress: pair.pairAddress,
          labels: pair.labels || [],
          baseToken: pair.baseToken,
          quoteToken: pair.quoteToken,
          createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
          age: pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 1000) : null,
          metrics: {
            price: {
              usd: pair.priceUsd || '0',
              native: pair.priceNative || '0',
              change24h: pair.priceChange?.['24h'] || 0
            },
            volume24h: pair.volume?.['24h'] || 0,
            liquidity: pair.liquidity || { usd: 0, base: 0, quote: 0 },
            marketCap: pair.marketCap || 0,
            fdv: pair.fdv || 0
          },
          transactions24h: pair.txns?.['24h'] || { buys: 0, sells: 0 },
          info: pair.info || null,
          boosts: pair.boosts || { active: 0 }
        });
        return acc;
      }, {} as Record<string, any[]>);

      res.status(200).json({
        success: true,
        data: {
          chainId,
          tokenAddresses,
          total: pairs.length,
          filtered: filteredPairs.length,
          tokenCount: Object.keys(pairsByToken).length,
          pairs: pairsByToken
        }
      });

    } catch (error) {
      logger.error('Get multi-token pairs error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token pairs'
      });
    }
  }
}
