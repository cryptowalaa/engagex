-- EngageX Database Schema - Run this in Supabase SQL Editor
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'brand', 'admin')),
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    twitter_handle TEXT,
    total_earned DECIMAL(20, 9) DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    reward_pool DECIMAL(20, 9) NOT NULL,
    currency TEXT DEFAULT 'USDC',
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'funded', 'active', 'completed', 'cancelled')),
    max_winners INTEGER DEFAULT 10,
    category TEXT DEFAULT 'social',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_link TEXT NOT NULL,
    platform TEXT DEFAULT 'twitter' CHECK (platform IN ('twitter', 'tiktok', 'youtube', 'instagram', 'other')),
    description TEXT,
    score DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'winner')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mission_id, creator_id)
);

-- Engagements table
CREATE TABLE IF NOT EXISTS engagements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    watch_time INTEGER DEFAULT 0, -- in seconds
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    amount DECIMAL(20, 9) NOT NULL,
    reward_type TEXT CHECK (reward_type IN ('creator', 'engager', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    transaction_signature TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    reward_amount DECIMAL(20, 9) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert user" ON users FOR INSERT WITH CHECK (true);

-- Missions policies
CREATE POLICY "Anyone can view active missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Brands can create missions" ON missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Brands can update own missions" ON missions FOR UPDATE USING (true);

-- Submissions policies
CREATE POLICY "Anyone can view submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Creators can submit" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can update own submissions" ON submissions FOR UPDATE USING (true);

-- Engagements policies
CREATE POLICY "Anyone can view engagements" ON engagements FOR SELECT USING (true);
CREATE POLICY "Users can create engagements" ON engagements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own engagements" ON engagements FOR UPDATE USING (true);

-- Rewards policies
CREATE POLICY "Users can view own rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "System can create rewards" ON rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update rewards" ON rewards FOR UPDATE USING (true);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Anyone can create referral" ON referrals FOR INSERT WITH CHECK (true);

-- Score calculation function
CREATE OR REPLACE FUNCTION calculate_submission_score(p_submission_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_score DECIMAL := 0;
BEGIN
    SELECT 
        COALESCE(SUM(likes * 1 + comments * 3 + shares * 5 + watch_time * 2), 0)
    INTO total_score
    FROM engagements
    WHERE submission_id = p_submission_id;
    
    UPDATE submissions SET score = total_score WHERE id = p_submission_id;
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
