-- Platform settings table for storing configuration like plans
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings" ON platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Anyone can read platform settings (for plans display)
CREATE POLICY "Anyone can read platform settings" ON platform_settings
  FOR SELECT USING (true);
