export interface IUser {
  id?: string;
  username: string;
  email: string;
  password: string;
  apiKey?: string;
  watchlist?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  watchedTokens?: {
    chainId: string;
    tokenAddress: string;
    addedAt: Date;
  }[];
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserRegistration extends IUserLogin {
  username: string;
}

export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  token: string;
}

export interface ITokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon: string;
  header: string;
  description: string;
  links: {
    type: string;
    label: string;
    url: string;
  }[];
}

export interface ITokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon: string;
  header: string;
  description: string;
  links: {
    type: string;
    label?: string;
    url: string;
  }[];
}

export interface ITokenOrder {
  type: string;
  status: 'processing' | 'completed' | 'failed';
  paymentTimestamp: number;
}

export interface IOrderParams {
  chainId: string;
  tokenAddress: string;
}

export interface IToken {
  address: string;
  name: string;
  symbol: string;
}

export interface ITransactions {
  [timeframe: string]: {
    buys: number;
    sells: number;
  };
}

export interface IVolume {
  [timeframe: string]: number;
}

export interface IPriceChange {
  [timeframe: string]: number;
}

export interface ILiquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface IWebsite {
  url: string;
}

export interface ISocial {
  platform: string;
  handle: string;
}

export interface IPairInfo {
  imageUrl: string;
  websites: IWebsite[];
  socials: ISocial[];
}

export interface IPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: IToken;
  quoteToken: IToken;
  priceNative: string;
  priceUsd: string;
  txns: ITransactions;
  volume: IVolume;
  priceChange: IPriceChange;
  liquidity: ILiquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt: number;
  info?: IPairInfo;
  boosts?: {
    active: number;
  };
}

export interface IPairsResponse {
  schemaVersion: string;
  pairs: IPair[];
}

export interface IAnalysis {
  recommendation: string;
  timestamp: string;
  scores?: {
    liquidity: number;
    volume: number;
    price: number;
    risk: number;
    overall: number;
  };
  signals?: {
    type: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    reason: string;
  }[];
}

export interface IPairAnalysisResponse {
  pairData: IPair[];
  analysis: IAnalysis;
}
