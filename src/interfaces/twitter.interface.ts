export interface TwitterCredentials {
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
  }
  
  export interface Tweet {
    id: string;
    text: string;
    author: string;
    createdAt: Date;
    keywords: string[];
  }
  
  export interface TwitterSearchParams {
    query: string;
    maxResults?: number;
  }
  
  // Add interface for Twitter API response
  export interface TwitterApiTweet {
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
  }