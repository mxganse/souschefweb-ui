-- Granular per-user permission flags.
-- Admin (mxganse@gmail.com) bypasses all checks in application code.
-- All permissions default false so new users have no access until explicitly granted.

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_add_recipes      boolean NOT NULL DEFAULT false,
  can_view_library     boolean NOT NULL DEFAULT false,
  library_view_scope   text    NOT NULL DEFAULT 'own_only' CHECK (library_view_scope IN ('own_only', 'all')),
  can_access_reference boolean NOT NULL DEFAULT false,
  can_export_pdf       boolean NOT NULL DEFAULT false,
  can_import_recipes   boolean NOT NULL DEFAULT false,
  can_email_recipe     boolean NOT NULL DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           uuid REFERENCES auth.users(id)
);

-- Allow the service role (server-side) to read and write
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (all server-side queries use service key)
CREATE POLICY "service_role_all" ON user_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
