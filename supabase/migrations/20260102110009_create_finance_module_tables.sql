/*
  # Module Finance et Comptabilité - Guardian Command

  1. Nouvelles Tables
    - `utilisateurs` : Gestion des accès RBAC (ADMIN, CEO, FINANCE, OPS_MANAGER, SUPERVISOR)
    - `clients` : Entités contractuelles (personnes morales ou physiques)
    - `sites` : Lieux physiques sécurisés pour chaque client
    - `plan_comptable` : Comptes OHADA pour automatisation comptable
    - `factures_clients` : Entêtes de factures avec gestion des créances
    - `factures_details` : Lignes de facturation détaillées par site
    - `audit_logs` : Journal d'audit pour traçabilité complète

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques basées sur les rôles utilisateurs
    - Audit trail pour toutes les modifications

  3. Normes OHADA
    - Comptes Classe 4 (Tiers & Dettes)
    - Comptes Classe 5 (Trésorerie)
    - Comptes Classe 6 (Charges)
    - Comptes Classe 7 (Produits)
*/

-- ============================================================================
-- 1. GESTION DES UTILISATEURS ET ACCÈS (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_utilisateur VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe_hash TEXT NOT NULL,
  nom_complet VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CEO', 'FINANCE', 'OPS_MANAGER', 'SUPERVISOR')),
  statut VARCHAR(10) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU')),
  derniere_connexion TIMESTAMP,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON utilisateurs FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Les admins peuvent voir tous les utilisateurs"
  ON utilisateurs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO')
    )
  );

-- ============================================================================
-- 2. TIERS : CLIENTS ET SITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_client VARCHAR(20) NOT NULL CHECK (type_client IN ('MORALE', 'PHYSIQUE')),
  nom_entreprise VARCHAR(150) NOT NULL,
  nif VARCHAR(50),
  rccm VARCHAR(50),
  id_national VARCHAR(50),
  numero_contrat VARCHAR(100) UNIQUE,
  contrat_url TEXT,
  contact_nom VARCHAR(100),
  contact_email VARCHAR(100),
  telephone VARCHAR(20),
  contact_urgence_nom VARCHAR(100),
  contact_urgence_telephone VARCHAR(20),
  adresse_facturation TEXT,
  devise_preferee VARCHAR(3) DEFAULT 'USD',
  delai_paiement_jours INTEGER DEFAULT 30,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs Finance peuvent voir les clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO', 'FINANCE', 'OPS_MANAGER')
    )
  );

CREATE POLICY "Les utilisateurs Finance peuvent créer des clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  );

CREATE POLICY "Les utilisateurs Finance peuvent modifier des clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  );

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  nom_site VARCHAR(150) NOT NULL,
  adresse_physique TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  effectif_jour_requis INTEGER DEFAULT 0,
  effectif_nuit_requis INTEGER DEFAULT 0,
  tarif_mensuel_client DECIMAL(15, 2) NOT NULL,
  taux_journalier_garde DECIMAL(15, 2) NOT NULL,
  consignes_specifiques TEXT,
  est_actif BOOLEAN DEFAULT TRUE
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs autorisés peuvent voir les sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO', 'FINANCE', 'OPS_MANAGER', 'SUPERVISOR')
    )
  );

CREATE POLICY "Les OPS et Finance peuvent créer des sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE', 'OPS_MANAGER')
    )
  );

CREATE POLICY "Les OPS et Finance peuvent modifier des sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE', 'OPS_MANAGER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE', 'OPS_MANAGER')
    )
  );

-- ============================================================================
-- 3. COMPTABILITÉ (OHADA) ET FACTURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_comptable (
  code_ohada VARCHAR(10) PRIMARY KEY,
  libelle VARCHAR(150) NOT NULL,
  type_compte VARCHAR(20) NOT NULL CHECK (type_compte IN ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT'))
);

ALTER TABLE plan_comptable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous les utilisateurs peuvent voir le plan comptable"
  ON plan_comptable FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS factures_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  numero_facture VARCHAR(50) UNIQUE NOT NULL,
  date_emission DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  periode_mois INTEGER,
  periode_annee INTEGER,
  total_gardiens_factures INTEGER DEFAULT 0,
  montant_ht_prestation DECIMAL(15, 2) NOT NULL,
  montant_frais_supp DECIMAL(15, 2) DEFAULT 0,
  motif_frais_supp TEXT,
  creances_anterieures DECIMAL(15, 2) DEFAULT 0,
  montant_total_ttc DECIMAL(15, 2) NOT NULL,
  montant_total_du_client DECIMAL(15, 2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'USD',
  statut_paiement VARCHAR(20) DEFAULT 'BROUILLON' CHECK (statut_paiement IN ('BROUILLON', 'ENVOYE', 'PAYE_PARTIEL', 'PAYE_TOTAL', 'ANNULE')),
  notes_facture TEXT
);

ALTER TABLE factures_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance peut voir toutes les factures"
  ON factures_clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO', 'FINANCE')
    )
  );

CREATE POLICY "Finance peut créer des factures"
  ON factures_clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  );

CREATE POLICY "Finance peut modifier des factures"
  ON factures_clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  );

CREATE TABLE IF NOT EXISTS factures_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures_clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  nombre_gardiens_site INTEGER NOT NULL,
  montant_forfaitaire_site DECIMAL(15, 2) NOT NULL,
  description_ligne TEXT
);

ALTER TABLE factures_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance peut voir les détails de factures"
  ON factures_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO', 'FINANCE')
    )
  );

CREATE POLICY "Finance peut créer des détails de factures"
  ON factures_details FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'FINANCE')
    )
  );

-- ============================================================================
-- 4. SYSTÈME : JOURNAL D'AUDIT (AUDIT TRAIL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_nom VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL,
  anciennes_valeurs JSONB,
  nouvelles_valeurs JSONB,
  utilisateur_id UUID REFERENCES utilisateurs(id),
  adresse_ip VARCHAR(45),
  horodatage TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seuls les admins peuvent voir les logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'CEO')
    )
  );

-- ============================================================================
-- 5. INSERTIONS INITIALES (STANDARDS OHADA)
-- ============================================================================

INSERT INTO plan_comptable (code_ohada, libelle, type_compte) VALUES
('411', 'Clients', 'ACTIF'),
('422', 'Personnel - Rémunérations dues', 'PASSIF'),
('401', 'Fournisseurs', 'PASSIF'),
('571', 'Caisse', 'ACTIF'),
('661', 'Salaires et Primes', 'CHARGE'),
('615', 'Entretien et Maintenance', 'CHARGE'),
('606', 'Eau, Électricité, Carburant', 'CHARGE'),
('706', 'Services Vendus', 'PRODUIT')
ON CONFLICT (code_ohada) DO NOTHING;