-- ============================================================================
-- CRÉATION D'UN UTILISATEUR DE TEST - Guardian Command
-- ============================================================================

-- Ce script permet de créer un utilisateur de test pour accéder au système
-- Guardian Command.

-- ÉTAPES À SUIVRE :

-- 1. CRÉER D'ABORD L'UTILISATEUR DANS SUPABASE AUTH
--    - Aller dans le Dashboard Supabase > Authentication > Users
--    - Cliquer sur "Add User"
--    - Email : admin@goaheadsecurity.com
--    - Mot de passe : GuardianCommand2026!
--    - Confirmer automatiquement l'email
--    - COPIER L'UUID généré (vous en aurez besoin à l'étape 2)

-- 2. EXÉCUTER CETTE REQUÊTE SQL
--    Remplacer 'UUID_COPIE_ETAPE_1' par l'UUID réel copié à l'étape 1

INSERT INTO utilisateurs (
    id,
    nom_utilisateur,
    nom_complet,
    role,
    statut,
    derniere_connexion
) VALUES (
    'UUID_COPIE_ETAPE_1',  -- REMPLACER PAR L'UUID RÉEL
    'admin',
    'Administrateur Principal',
    'ADMIN',
    'ACTIF',
    NULL
);

-- RÉSULTAT ATTENDU :
-- Une ligne insérée avec succès

-- CONNEXION AU SYSTÈME :
-- Email : admin@goaheadsecurity.com
-- Mot de passe : GuardianCommand2026!

-- ============================================================================
-- CRÉATION D'UTILISATEURS SUPPLÉMENTAIRES (Optionnel)
-- ============================================================================

-- Pour créer d'autres utilisateurs avec différents rôles, répéter les étapes 1 et 2
-- avec les informations suivantes :

-- UTILISATEUR FINANCE
-- Email : finance@goaheadsecurity.com
-- Mot de passe : Finance2026!
-- Rôle : FINANCE

-- UTILISATEUR OPS MANAGER
-- Email : operations@goaheadsecurity.com
-- Mot de passe : Operations2026!
-- Rôle : OPS_MANAGER

-- UTILISATEUR CEO
-- Email : ceo@goaheadsecurity.com
-- Mot de passe : CEO2026!
-- Rôle : CEO

-- UTILISATEUR SUPERVISOR
-- Email : supervisor@goaheadsecurity.com
-- Mot de passe : Supervisor2026!
-- Rôle : SUPERVISOR

-- Exemple pour utilisateur FINANCE :
/*
INSERT INTO utilisateurs (
    id,
    nom_utilisateur,
    nom_complet,
    role,
    statut
) VALUES (
    'UUID_UTILISATEUR_FINANCE',
    'finance',
    'Responsable Financier',
    'FINANCE',
    'ACTIF'
);
*/

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Pour vérifier que l'utilisateur a été créé correctement :
SELECT
    id,
    nom_utilisateur,
    nom_complet,
    role,
    statut,
    cree_le
FROM utilisateurs
ORDER BY cree_le DESC;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- 1. NE JAMAIS partager les mots de passe en production
-- 2. Changer les mots de passe de test avant la mise en production
-- 3. L'UUID doit correspondre EXACTEMENT à celui de Supabase Auth
-- 4. Les rôles déterminent les permissions d'accès :
--    - ADMIN : Accès complet
--    - CEO : Lecture seule tous modules
--    - FINANCE : Gestion Finance et Comptabilité
--    - OPS_MANAGER : Gestion Opérations et Sites
--    - SUPERVISOR : Accès terrain limité
