import { UserModel } from './user.model';
import { IUser, IUserRegistration, IUserLogin, ITokenProfile, ITokenBoost, ITokenOrder, IOrderParams, IPairsResponse, IPair } from './user.interface';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AnalysisService } from '../../services/analysis.service';
import { logger } from '../../utils/logger';

export class UserCrud {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService();
  }

  async register(userData: IUserRegistration): Promise<IUser> {
    const existingUser = await UserModel.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new UserModel(userData);
    await user.save();
    return user;
  }

  async login(credentials: IUserLogin): Promise<{ user: IUser; token: string }> {
    const user = await UserModel.findOne({ email: credentials.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async addTokenToWatchlist(userId: string, chainId: string, tokenAddress: string): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if token already exists in watchlist
    const tokenExists = user.watchedTokens?.some(
      token => token.chainId === chainId && token.tokenAddress === tokenAddress
    );

    if (tokenExists) {
      throw new Error('Token already in watchlist');
    }

    // Add token to watchlist
    user.watchedTokens = user.watchedTokens || [];
    user.watchedTokens.push({
      chainId,
      tokenAddress,
      addedAt: new Date()
    });

    await user.save();
    return user;
  }

  async getTokenProfiles(userId: string): Promise<ITokenProfile[]> {
    const user = await UserModel.findById(userId);
    if (!user || !user.watchedTokens?.length) {
      return [];
    }

    try {
      const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch token profiles');
    }
  }

  async removeTokenFromWatchlist(userId: string, chainId: string, tokenAddress: string): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.watchedTokens = user.watchedTokens?.filter(
      token => !(token.chainId === chainId && token.tokenAddress === tokenAddress)
    ) || [];

    await user.save();
    return user;
  }

  async getTokenBoosts(): Promise<ITokenBoost[]> {
    try {
      const response = await axios.get('https://api.dexscreener.com/token-boosts/latest/v1');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch token boosts');
    }
  }

  async getTopTokenBoosts(): Promise<ITokenBoost[]> {
    try {
      const response = await axios.get('https://api.dexscreener.com/token-boosts/top/v1');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch top token boosts');
    }
  }

  async getTokenOrders(params: IOrderParams): Promise<ITokenOrder[]> {
    try {
      const { chainId, tokenAddress } = params;
      const response = await axios.get(
        `https://api.dexscreener.com/orders/v1/${chainId}/${tokenAddress}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []; // Return empty array if no orders found
      }
      throw new Error('Failed to fetch token orders');
    }
  }

  async getPairInfo(chainId: string, pairId: string): Promise<IPairsResponse> {
    try {
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { schemaVersion: '1.0.0', pairs: [] };
      }
      throw new Error('Failed to fetch pair information');
    }
  }

  async searchPairs(query: string): Promise<IPairsResponse> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/search?q=${encodedQuery}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { schemaVersion: '1.0.0', pairs: [] };
      }
      throw new Error('Failed to search pairs');
    }
  }

  async getTokenPairs(chainId: string, tokenAddress: string): Promise<any> {
    try {
      // Updated DexScreener API endpoint with search
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/search/?q=${tokenAddress}`
      );

      // Check if we have valid pairs data
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return {
          pairData: {
            pairs: [],
            chainId,
            tokenAddress
          },
          analysis: null,
          timestamp: new Date().toISOString()
        };
      }

      // Filter pairs for the specified chain and token
      const chainPairs = response.data.pairs.filter((pair: any) => {
        const isCorrectChain = pair.chainId.toLowerCase() === chainId.toLowerCase();
        const isBaseToken = pair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase();
        const isQuoteToken = pair.quoteToken.address.toLowerCase() === tokenAddress.toLowerCase();
        return isCorrectChain && (isBaseToken || isQuoteToken);
      });

      if (chainPairs.length === 0) {
        return {
          pairData: {
            pairs: [],
            chainId,
            tokenAddress
          },
          analysis: null,
          timestamp: new Date().toISOString()
        };
      }

      // Sort pairs by liquidity
      const sortedPairs = chainPairs.sort((a: any, b: any) => {
        const liquidityA = a.liquidity?.usd || 0;
        const liquidityB = b.liquidity?.usd || 0;
        return liquidityB - liquidityA;
      });

      const analysis = await this.analysisService.analyzePairs(sortedPairs[0]);

      return {
        pairData: {
          pairs: sortedPairs,
          total: sortedPairs.length,
          chainId,
          tokenAddress
        },
        analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Token pairs error:', error);
      if (axios.isAxiosError(error)) {
        logger.error('DexScreener API Error:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      throw new Error('Failed to fetch and analyze token pairs');
    }
  }

  async getMultiTokenPairs(chainId: string, tokenAddresses: string[]): Promise<IPair[]> {
    try {
      // Join addresses with comma and ensure no more than 30 tokens
      const addressList = tokenAddresses.slice(0, 30).join(',');
      const response = await axios.get(
        `https://api.dexscreener.com/tokens/v1/${chainId}/${addressList}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch token pairs');
    }
  }
}
