/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:42:31
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:42:33
 * @FilePath: /Vetta/types/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface SourcingStrategy {
  core_tags: string[];
  lifestyle_tags: string[];
  visual_actions: string[];
  aesthetic_keywords: string[];
  search_queries: string[];
}

export interface Candidate {
  id: string;
  url: string;
  match_score: number;
  niche: string;
  followers?: number;
  avatar_color: string;
  avatar_url?: string;
  is_verified?: boolean;
  match_reason?: string;
  is_commercial?: boolean;
}

export interface AuditResult {
  style_tags: string[]; // Simplification: Gemini outputs array directly
  brand_fit_score: number;
  consistency_score: number; // New: V3.1 Consistency Metric
  audit_reason: string;
  personalized_greeting: string;
  engagement_analysis: string;
  visual_analysis: string;
  niche_category: string;
  risk_factors: string[]; // New: List of red flags
  
  // New V3.1 UI Fields
  cost_estimation: {
    apify_cost: number;
    ai_cost: number;
    total_cny: number;
  };
  
  // For visual wall
  recent_posts: Array<{
    url?: string;
    post_url?: string;
    image_url?: string;
    caption: string;
    likes: number;
  }>;
  
  // Profile data for the card
  profile: {
    username: string;
    followers: number;
    avg_likes: number;
    engagement_rate: string;
  };
}
