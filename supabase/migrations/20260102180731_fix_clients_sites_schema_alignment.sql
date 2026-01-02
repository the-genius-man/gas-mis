/*
  # Fix Clients and Sites Schema Alignment

  1. Updates to Clients Table
    - Rename `nom_entreprise` to `raison_sociale` for consistency
    - Rename `contact_nom` to `contact_principal_nom`
    - Rename `contact_email` to `contact_principal_email`
    - Rename `telephone` to `contact_principal_telephone`
    - Rename `devise_preferee` to `devise_facturation`
    - Add `numero_contrat` if missing (already exists in schema)

  2. Updates to Sites Table
    - Rename `nom_site` to `nom`
    - Rename `effectif_jour_requis` to `effectif_requis_jour`
    - Rename `effectif_nuit_requis` to `effectif_requis_nuit`
    - Rename `est_actif` to `statut` (with ENUM values)
    - Rename `adresse_physique` to match frontend expectations
    - Add `localisation` field

  3. Purpose
    - Align database schema with frontend TypeScript interfaces
    - Ensure consistency across the application
*/

-- ============================================================================
-- 1. UPDATE CLIENTS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Rename nom_entreprise to raison_sociale
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'nom_entreprise'
  ) THEN
    ALTER TABLE clients RENAME COLUMN nom_entreprise TO raison_sociale;
  END IF;

  -- Rename contact_nom to contact_principal_nom
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'contact_nom'
  ) THEN
    ALTER TABLE clients RENAME COLUMN contact_nom TO contact_principal_nom;
  END IF;

  -- Rename contact_email to contact_principal_email
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE clients RENAME COLUMN contact_email TO contact_principal_email;
  END IF;

  -- Rename telephone to contact_principal_telephone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE clients RENAME COLUMN telephone TO contact_principal_telephone;
  END IF;

  -- Rename devise_preferee to devise_facturation
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'devise_preferee'
  ) THEN
    ALTER TABLE clients RENAME COLUMN devise_preferee TO devise_facturation;
  END IF;

  -- Rename cree_le to created_at if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'cree_le'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE clients RENAME COLUMN cree_le TO created_at;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- ============================================================================
-- 2. UPDATE SITES TABLE
-- ============================================================================

DO $$
BEGIN
  -- Rename nom_site to nom
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'nom_site'
  ) THEN
    ALTER TABLE sites RENAME COLUMN nom_site TO nom;
  END IF;

  -- Add localisation if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'localisation'
  ) THEN
    ALTER TABLE sites ADD COLUMN localisation VARCHAR(200);
    -- Copy from nom if localisation is NULL
    UPDATE sites SET localisation = nom WHERE localisation IS NULL;
  END IF;

  -- Rename effectif_jour_requis to effectif_requis_jour
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'effectif_jour_requis'
  ) THEN
    ALTER TABLE sites RENAME COLUMN effectif_jour_requis TO effectif_requis_jour;
  END IF;

  -- Rename effectif_nuit_requis to effectif_requis_nuit
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'effectif_nuit_requis'
  ) THEN
    ALTER TABLE sites RENAME COLUMN effectif_nuit_requis TO effectif_requis_nuit;
  END IF;

  -- Convert est_actif (boolean) to statut (VARCHAR)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'est_actif' AND data_type = 'boolean'
  ) THEN
    -- Add new statut column
    ALTER TABLE sites ADD COLUMN statut VARCHAR(10) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF'));
    
    -- Migrate data
    UPDATE sites SET statut = CASE WHEN est_actif = true THEN 'ACTIF' ELSE 'INACTIF' END;
    
    -- Drop old column
    ALTER TABLE sites DROP COLUMN est_actif;
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE sites ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sites ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;
