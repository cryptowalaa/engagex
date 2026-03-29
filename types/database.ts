export type UserRole = 'user' | 'creator' | 'brand' | 'admin'
export type MissionStatus = 'draft' | 'funded' | 'active' | 'completed' | 'cancelled'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner'
export type RewardStatus = 'pending' | 'processing' | 'paid' | 'failed'
export type Platform = 'twitter' | 'tiktok' | 'youtube' | 'instagram' | 'other'

export interface User {
  id: string
  wallet_address: string
  role: UserRole
  username: string | null
  avatar_url: string | null
  bio: string | null
  twitter_handle: string | null
  total_earned: number
  referral_code: string | null
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  brand_id: string
  title: string
  description: string
  requirements: string | null
  reward_pool: number
  currency: string
  deadline: string
  status: MissionStatus
  max_winners: number
  category: string
  image_url: string | null
  created_at: string
  updated_at: string
  brand?: User
}

export interface Submission {
  id: string
  mission_id: string
  creator_id: string
  content_link: string
  platform: Platform
  description: string | null
  score: number
  status: SubmissionStatus
  submitted_at: string
  creator?: User
  mission?: Mission
}

export interface Engagement {
  id: string
  submission_id: string
  user_id: string
  likes: number
  comments: number
  shares: number
  watch_time: number
  recorded_at: string
}

export interface Reward {
  id: string
  user_id: string
  mission_id: string
  submission_id: string | null
  amount: number
  reward_type: 'creator' | 'engager' | 'referral'
  status: RewardStatus
  transaction_signature: string | null
  paid_at: string | null
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: 'pending' | 'completed'
  reward_amount: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      missions: { Row: Mission; Insert: Partial<Mission>; Update: Partial<Mission> }
      submissions: { Row: Submission; Insert: Partial<Submission>; Update: Partial<Submission> }
      engagements: { Row: Engagement; Insert: Partial<Engagement>; Update: Partial<Engagement> }
      rewards: { Row: Reward; Insert: Partial<Reward>; Update: Partial<Reward> }
      referrals: { Row: Referral; Insert: Partial<Referral>; Update: Partial<Referral> }
    }
  }
}
