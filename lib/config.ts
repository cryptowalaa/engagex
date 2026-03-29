export const APP_CONFIG = {
  name: 'EngageX',
  description: 'Web3 Gamified Attention Marketplace on Solana',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  adminWallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || 'Dq7SP6JMswPPCdiyhKjnigHc3L4sWGmEfvWwPSiSn5cY',
  treasuryWallet: process.env.NEXT_PUBLIC_TREASURY_WALLET || 'A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP',
}

export const REWARD_SPLIT = {
  creators: 0.60,   // 60% to winning creators
  engagers: 0.20,   // 20% to early engagers
  platform: 0.20,   // 20% platform fee
}

export const SCORE_WEIGHTS = {
  likes: 1,
  comments: 3,
  shares: 5,
  watchTime: 2,
}

export const MISSION_CATEGORIES = [
  'Social Media',
  'Video Content',
  'Blog/Article',
  'Community',
  'Product Review',
  'Trading',
  'NFT',
  'DeFi',
]

export const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Other' },
]
