-- Ajoute 'free' au type enum plan_tier (si absent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'free'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_tier')
  ) THEN
    ALTER TYPE plan_tier ADD VALUE 'free' BEFORE 'starter';
  END IF;
END$$;

-- Ajoute la colonne plan sur users (si absente)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan plan_tier NOT NULL DEFAULT 'free';
