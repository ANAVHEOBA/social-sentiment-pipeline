import { OpenAI } from 'openai';
import { logger } from '../utils/logger';

// Export the interfaces
export interface TradingPair {
  priceUsd: number;
  volume?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number;
  };
  priceChange?: {
    h24?: number;
  };
  txns?: {
    h24?: {
      buys: number;
      sells: number;
    };
  };
  pairAddress?: string;
  dexId?: string;
}

export interface PairData {
  pairs?: TradingPair[];
  chainId?: string;
  tokenAddress?: string;
}

export interface AnalysisResult {
  scores: {
    volume: number;
    liquidity: number;
    price: number;
    risk: number;
    overall: number;
  };
  recommendation: string;
  explanation: string;
  pairAddress: string;
  dexId: string;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
}



interface AIAnalysisResponse {
  recommendation: string;
  explanation: string;
  confidence: number;
}

export class AnalysisService {
  private readonly client: OpenAI;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:5000",
        "X-Title": "Social Sentiment Pipeline"
      },
      timeout: 30000 // 30 second timeout
    });
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries > 0 && error?.message?.includes('Connection error')) {
        const delay = this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1);
        logger.warn(`Retrying operation in ${delay}ms. Attempts remaining: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retries - 1);
      }
      throw error;
    }
  }

  private async getAIAnalysis(pair: TradingPair): Promise<AIAnalysisResponse> {
    try {
      // Format metrics for AI analysis
      const metrics = {
        volume: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        priceChange: pair.priceChange?.h24 || 0,
        buyCount: pair.txns?.h24?.buys || 0,
        sellCount: pair.txns?.h24?.sells || 0
      };

      const prompt = `Analyze this trading pair's metrics and provide a trading recommendation:
- 24h Volume: $${metrics.volume.toLocaleString()}
- Liquidity: $${metrics.liquidity.toLocaleString()}
- Price Change (24h): ${metrics.priceChange.toFixed(2)}%
- Transactions: ${metrics.buyCount} buys vs ${metrics.sellCount} sells

Respond with ONLY a JSON object in this format:
{
  "recommendation": "Buy|Hold|Sell",
  "explanation": "Brief reason for recommendation",
  "confidence": number between 0-100
}`;

      const completion = await this.retryWithBackoff(() => 
        this.client.chat.completions.create({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content: "You are a trading pair analyzer. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1
        })
      );

      // Handle potential undefined response
      if (!completion?.choices?.[0]?.message?.content) {
        logger.warn('Empty AI response, using fallback analysis');
        return this.generateFallbackAnalysis(pair);
      }

      const content = completion.choices[0].message.content;
      logger.info('Raw AI Response:', content);

      try {
        // Try to parse JSON response
        const response = JSON.parse(content) as AIAnalysisResponse;
        return {
          recommendation: this.normalizeRecommendation(response.recommendation),
          explanation: this.normalizeExplanation(response.explanation),
          confidence: this.normalizeConfidence(response.confidence)
        };
      } catch (parseError) {
        logger.warn('Failed to parse AI response:', parseError);
        return this.generateFallbackAnalysis(pair);
      }
    } catch (error) {
      logger.error('AI Analysis error:', error);
      return this.generateFallbackAnalysis(pair);
    }
  }

  private parseUnstructuredResponse(content: string): AIAnalysisResponse {
    // Extract recommendation
    const recMatch = content.match(/recommend.*?(buy|hold|sell)/i);
    const recommendation = recMatch ? recMatch[1].toUpperCase() : 'HOLD';

    // Extract explanation
    const expMatch = content.match(/analysis:?(.*?)(?=confidence:|$)/i);
    const explanation = expMatch ? expMatch[1].trim() : 'Analysis based on metrics';

    // Extract confidence
    const confMatch = content.match(/confidence:?\s*(\d+)/i);
    const confidence = confMatch ? parseInt(confMatch[1]) : 50;

    return { recommendation, explanation, confidence };
  }

  private normalizeRecommendation(rec: string): string {
    const normalized = rec.toUpperCase().trim();
    return ['BUY', 'HOLD', 'SELL'].includes(normalized) ? normalized : 'HOLD';
  }

  private normalizeExplanation(exp: string): string {
    if (!exp || typeof exp !== 'string') {
      return 'Analysis based on available metrics';
    }
    return exp.trim().slice(0, 500);
  }

  private normalizeConfidence(conf: any): number {
    const num = Number(conf);
    if (isNaN(num) || num < 0 || num > 100) {
      return 50;
    }
    return Math.round(num);
  }

  private generateFallbackAnalysis(pair: TradingPair): AIAnalysisResponse {
    // Calculate traditional metrics
    const volumeScore = Math.min(Math.log10(pair.volume?.h24 || 1) * 10, 100);
    const liquidityScore = Math.min(Math.log10(pair.liquidity?.usd || 1) * 10, 100);
    const riskScore = this.calculateRiskScore(pair);
    
    const overallScore = (volumeScore + liquidityScore + riskScore) / 3;
    
    // Generate explanation based on metrics
    const explanation = this.generateExplanation(
      pair,
      volumeScore,
      liquidityScore,
      riskScore,
      overallScore
    );
    
    return {
      recommendation: this.generateRecommendation(overallScore),
      explanation,
      confidence: Math.round(overallScore)
    };
  }

  async analyzePairs(pairData: PairData) {
    try {
      const pairs = pairData.pairs || [];
      const individualAnalyses: AnalysisResult[] = [];

      for (const pair of pairs) {
        // Get traditional metrics
        const volumeScore = Math.min(Math.log10(pair.volume?.h24 || 1) * 10, 100);
        const liquidityScore = Math.min(Math.log10(pair.liquidity?.usd || 1) * 10, 100);
        const priceScore = Math.min(Math.max(50 + ((pair.priceChange?.h24 || 0) * 2), 0), 100);
        const riskScore = this.calculateRiskScore(pair);

        // Get AI analysis
        const aiAnalysis = await this.getAIAnalysis(pair);

        // Combine traditional and AI analysis
        const overallScore = (
          volumeScore * 0.3 +
          liquidityScore * 0.25 +
          priceScore * 0.2 +
          riskScore * 0.15 +
          aiAnalysis.confidence * 0.1
        );

        individualAnalyses.push({
          scores: {
            volume: Math.round(volumeScore),
            liquidity: Math.round(liquidityScore),
            price: Math.round(priceScore),
            risk: Math.round(riskScore),
            overall: Math.round(overallScore)
          },
          recommendation: aiAnalysis.recommendation,
          explanation: aiAnalysis.explanation,
          pairAddress: pair.pairAddress || '',
          dexId: pair.dexId || '',
          volume24h: pair.volume?.h24 || 0,
          liquidity: pair.liquidity?.usd || 0,
          priceChange24h: pair.priceChange?.h24 || 0
        });
      }

      // Sort by overall score descending
      individualAnalyses.sort((a, b) => b.scores.overall - a.scores.overall);

      return {
        individualAnalyses,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Analysis error:', error);
      throw new Error('Analysis failed');
    }
  }

  private calculateRiskScore(pair: TradingPair): number {
    const txns = pair.txns?.h24 || { buys: 0, sells: 0 };
    const totalTxns = txns.buys + txns.sells;
    if (totalTxns === 0) return 50; // Neutral score for no activity

    const buyRatio = txns.buys / totalTxns;
    const volatility = Math.abs(pair.priceChange?.h24 || 0);
    
    // Consider both buy/sell ratio and volatility
    const riskScore = (buyRatio * 70) + ((1 - volatility) * 30);
    return Math.min(Math.max(riskScore, 0), 100);
  }

  private generateExplanation(
    pair: TradingPair, 
    volumeScore: number, 
    liquidityScore: number, 
    priceScore: number, 
    riskScore: number
  ): string {
    const volume24h = pair.volume?.h24 || 0;
    const liquidity = pair.liquidity?.usd || 0;
    const priceChange = pair.priceChange?.h24 || 0;
    const txns = pair.txns?.h24 || { buys: 0, sells: 0 };

    return `${pair.dexId?.toUpperCase()} pair analysis: ` +
           `24h volume $${volume24h.toLocaleString()} (score: ${volumeScore.toFixed(1)}), ` +
           `liquidity $${liquidity.toLocaleString()} (score: ${liquidityScore.toFixed(1)}), ` +
           `price change ${priceChange.toFixed(2)}% (score: ${priceScore.toFixed(1)}), ` +
           `${txns.buys}/${txns.sells} buy/sell ratio (risk: ${riskScore.toFixed(1)}).`;
  }

  private generateRecommendation(score: number): string {
    if (score >= 80) return 'Strong Buy';
    if (score >= 60) return 'Buy';
    if (score >= 40) return 'Hold';
    if (score >= 20) return 'Sell';
    return 'Strong Sell';
  }
} 