-- ============================================================================
-- Create New User in Guardian Command
-- ============================================================================
--
-- IMPORTANT: This script uses Supabase Auth functions to create users.
-- The trigger will automatically create a corresponding record in the
-- utilisateurs table.
--
-- To create a new user, you can either:
-- 1. Use the Supabase Dashboard (Authentication > Users > Add User)
-- 2. Execute the SQL examples below in the SQL Editor
-- ============================================================================

-- Example 1: Create an ADMIN user
-- Replace email and password with your desired credentials
SELECT auth.users();  -- First check existing users

-- Note: In Supabase Dashboard, go to Authentication > Users > Add User
-- Then fill in:
--   Email: your-email@example.com
--   Password: YourSecurePassword123!
--   Auto Confirm: YES (checked)
--   User Metadata (JSON):
--   {
--     "nom_complet": "Your Full Name",
--     "role": "ADMIN"
--   }

-- The trigger will automatically:
-- 1. Create the user in auth.users
-- 2. Create a matching record in utilisateurs table
-- 3. Set the role from metadata (or default to SUPERVISOR)

-- ============================================================================
-- Verify User Creation
-- ============================================================================

-- Check auth.users
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check utilisateurs table (should have matching records)
SELECT id, nom_utilisateur, nom_complet, role, statut, cree_le
FROM utilisateurs
ORDER BY cree_le DESC;

-- ============================================================================
-- Update User Role (if needed)
-- ============================================================================

-- If you need to update a user's role after creation:
UPDATE utilisateurs
SET role = 'ADMIN'  -- Options: ADMIN, CEO, FINANCE, OPS_MANAGER, SUPERVISOR
WHERE nom_utilisateur = 'user@example.com';

-- ============================================================================
-- Available Roles and Permissions
-- ============================================================================
--
-- ADMIN: Full system access, can manage all modules
-- CEO: View all data, limited modifications
-- FINANCE: Full access to Finance module, view Operations
-- OPS_MANAGER: Full access to Operations and Sites
-- SUPERVISOR: Basic access, field operations
-- ============================================================================
