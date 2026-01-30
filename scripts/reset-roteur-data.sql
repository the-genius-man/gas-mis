-- Reset roteur assignment data and create sample data
-- This script clears existing roteur assignments and creates fresh test data

-- Clear existing roteur assignments
DELETE FROM affectations_roteur;

-- Create sample roteurs if none exist
INSERT OR IGNORE INTO employees_gas (
  nom_complet, matricule, poste, categorie, statut, 
  date_embauche, telephone, created_at
) VALUES 
  ('Jean ROTEUR', 'ROT001', 'ROTEUR', 'GARDE', 'ACTIF', '2024-01-01', '+237 6XX XX XX XX', datetime('now')),
  ('Marie ROTEUR', 'ROT002', 'ROTEUR', 'GARDE', 'ACTIF', '2024-01-01', '+237 6YY YY YY YY', datetime('now')),
  ('Paul ROTEUR', 'ROT003', 'ROTEUR', 'GARDE', 'ACTIF', '2024-01-01', '+237 6ZZ ZZ ZZ ZZ', datetime('now'));

-- Create sample sites if none exist
INSERT OR IGNORE INTO sites_gas (
  nom_site, client_nom, adresse, statut, created_at
) VALUES 
  ('Site Alpha', 'Client A', 'Adresse Alpha', 'ACTIF', datetime('now')),
  ('Site Beta', 'Client B', 'Adresse Beta', 'ACTIF', datetime('now')),
  ('Site Gamma', 'Client C', 'Adresse Gamma', 'ACTIF', datetime('now')),
  ('Site Delta', 'Client D', 'Adresse Delta', 'ACTIF', datetime('now')),
  ('Site Echo', 'Client E', 'Adresse Echo', 'ACTIF', datetime('now'));

-- Create sample guards if none exist
INSERT OR IGNORE INTO employees_gas (
  nom_complet, matricule, poste, categorie, statut, 
  date_embauche, telephone, created_at
) VALUES 
  ('Guard Alpha', 'GRD001', 'GARDE', 'GARDE', 'ACTIF', '2024-01-01', '+237 6AA AA AA AA', datetime('now')),
  ('Guard Beta', 'GRD002', 'GARDE', 'GARDE', 'ACTIF', '2024-01-01', '+237 6BB BB BB BB', datetime('now')),
  ('Guard Gamma', 'GRD003', 'GARDE', 'GARDE', 'ACTIF', '2024-01-01', '+237 6CC CC CC CC', datetime('now')),
  ('Guard Delta', 'GRD004', 'GARDE', 'GARDE', 'ACTIF', '2024-01-01', '+237 6DD DD DD DD', datetime('now')),
  ('Guard Echo', 'GRD005', 'GARDE', 'GARDE', 'ACTIF', '2024-01-01', '+237 6EE EE EE EE', datetime('now'));

-- Clear existing deployments for sample sites
DELETE FROM deployments WHERE site_id IN (
  SELECT id FROM sites_gas WHERE nom_site IN ('Site Alpha', 'Site Beta', 'Site Gamma', 'Site Delta', 'Site Echo')
);

-- Create deployments (1 guard per site to make them eligible for roteur coverage)
INSERT INTO deployments (employee_id, site_id, poste, statut, date_debut, created_at)
SELECT 
  e.id,
  s.id,
  'JOUR',
  'ACTIF',
  date('now'),
  datetime('now')
FROM employees_gas e
CROSS JOIN sites_gas s
WHERE e.poste = 'GARDE' 
  AND e.categorie = 'GARDE'
  AND e.statut = 'ACTIF'
  AND s.nom_site IN ('Site Alpha', 'Site Beta', 'Site Gamma', 'Site Delta', 'Site Echo')
  AND e.matricule IN ('GRD001', 'GRD002', 'GRD003', 'GRD004', 'GRD005')
  AND s.nom_site = CASE 
    WHEN e.matricule = 'GRD001' THEN 'Site Alpha'
    WHEN e.matricule = 'GRD002' THEN 'Site Beta'
    WHEN e.matricule = 'GRD003' THEN 'Site Gamma'
    WHEN e.matricule = 'GRD004' THEN 'Site Delta'
    WHEN e.matricule = 'GRD005' THEN 'Site Echo'
  END;

-- Create sample weekly roteur assignments
INSERT INTO affectations_roteur (
  roteur_id, site_id, date_debut, date_fin, poste, statut, 
  notes, weekly_assignments, created_at
)
SELECT 
  r.id,
  s.id,
  '2024-01-01',
  '2099-12-31',
  'JOUR',
  'EN_COURS',
  'Rotation hebdomadaire pour ' || r.nom_complet,
  CASE r.matricule
    WHEN 'ROT001' THEN json('[
      {
        "day_of_week": 1,
        "site_id": "' || s1.id || '",
        "site_nom": "' || s1.nom_site || '",
        "poste": "JOUR",
        "notes": "Rotation lundi"
      },
      {
        "day_of_week": 3,
        "site_id": "' || s2.id || '",
        "site_nom": "' || s2.nom_site || '",
        "poste": "JOUR", 
        "notes": "Rotation mercredi"
      },
      {
        "day_of_week": 5,
        "site_id": "' || s3.id || '",
        "site_nom": "' || s3.nom_site || '",
        "poste": "NUIT",
        "notes": "Rotation vendredi soir"
      }
    ]')
    WHEN 'ROT002' THEN json('[
      {
        "day_of_week": 2,
        "site_id": "' || s4.id || '",
        "site_nom": "' || s4.nom_site || '",
        "poste": "JOUR",
        "notes": "Rotation mardi"
      },
      {
        "day_of_week": 4,
        "site_id": "' || s5.id || '",
        "site_nom": "' || s5.nom_site || '",
        "poste": "NUIT",
        "notes": "Rotation jeudi soir"
      }
    ]')
  END,
  datetime('now')
FROM employees_gas r
CROSS JOIN sites_gas s
CROSS JOIN sites_gas s1
CROSS JOIN sites_gas s2  
CROSS JOIN sites_gas s3
CROSS JOIN sites_gas s4
CROSS JOIN sites_gas s5
WHERE r.poste = 'ROTEUR' 
  AND r.statut = 'ACTIF'
  AND r.matricule IN ('ROT001', 'ROT002')
  AND s.nom_site = CASE 
    WHEN r.matricule = 'ROT001' THEN 'Site Alpha'
    WHEN r.matricule = 'ROT002' THEN 'Site Delta'
  END
  AND s1.nom_site = 'Site Alpha'
  AND s2.nom_site = 'Site Beta'
  AND s3.nom_site = 'Site Gamma'
  AND s4.nom_site = 'Site Delta'
  AND s5.nom_site = 'Site Echo';

-- Verify the data
SELECT 'Roteurs created:' as info;
SELECT nom_complet, matricule, poste FROM employees_gas WHERE poste = 'ROTEUR' AND statut = 'ACTIF';

SELECT 'Sites created:' as info;
SELECT nom_site, client_nom FROM sites_gas WHERE nom_site LIKE 'Site %';

SELECT 'Deployments created:' as info;
SELECT s.nom_site, e.nom_complet as guard_name 
FROM deployments d
JOIN sites_gas s ON d.site_id = s.id
JOIN employees_gas e ON d.employee_id = e.id
WHERE s.nom_site LIKE 'Site %' AND d.statut = 'ACTIF';

SELECT 'Roteur assignments created:' as info;
SELECT r.nom_complet as roteur_name, s.nom_site, ar.statut, ar.weekly_assignments
FROM affectations_roteur ar
JOIN employees_gas r ON ar.roteur_id = r.id
JOIN sites_gas s ON ar.site_id = s.id
WHERE ar.statut IN ('EN_COURS', 'PLANIFIE');