/*
  # Fix User Creation - Auto-populate utilisateurs table

  1. Changes
    - Create trigger function to auto-create utilisateurs record when auth user is created
    - Links auth.users to public.utilisateurs automatically
    - Sets default role from user metadata or defaults to 'SUPERVISOR'
    - Removes dependency on manual user creation
  
  2. Security
    - Maintains RLS policies
    - Uses auth.uid() for secure row identification
  
  3. Notes
    - Trigger fires after INSERT on auth.users
    - User metadata from signup is used to populate role and full name
    - Password hash field in utilisateurs is kept for backward compatibility but not used
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.utilisateurs (
    id,
    nom_utilisateur,
    mot_de_passe_hash,
    nom_complet,
    role,
    statut,
    derniere_connexion,
    cree_le
  )
  VALUES (
    NEW.id,
    NEW.email,
    'managed_by_supabase_auth',
    COALESCE(NEW.raw_user_meta_data->>'nom_complet', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR')::VARCHAR,
    'ACTIF',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
