-- Add Stripe fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_tokens_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Create subscriptions history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL,
  currency TEXT DEFAULT 'usd',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for subscription history
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policy for managing subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON subscription_history
  FOR ALL USING (is_admin());

-- Function to reset AI tokens monthly
CREATE OR REPLACE FUNCTION reset_ai_tokens_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ai_tokens_reset_at < NOW() - INTERVAL '1 month' THEN
    NEW.ai_tokens_used := 0;
    NEW.ai_tokens_reset_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset tokens
DROP TRIGGER IF EXISTS trigger_reset_ai_tokens ON profiles;
CREATE TRIGGER trigger_reset_ai_tokens
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION reset_ai_tokens_if_needed();
