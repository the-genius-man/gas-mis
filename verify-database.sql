-- ============================================================================
-- SCRIPT DE VÉRIFICATION - Guardian Command
-- ============================================================================
-- Exécutez ces requêtes dans le SQL Editor de Supabase pour diagnostiquer

-- 1. Vérifier si les tables existent
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Résultat attendu : audit_logs, clients, factures_clients, factures_details,
--                    plan_comptable, sites, utilisateurs

-- ============================================================================

-- 2. Vérifier les utilisateurs dans auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC;

-- Résultat attendu : Au moins 1 ligne avec admin@goaheadsecurity.com
-- Si vide : Vous devez créer l'utilisateur (voir CREATION_COMPTE_DETAILLE.md)

-- ============================================================================

-- 3. Vérifier les utilisateurs dans la table utilisateurs
SELECT
    id,
    nom_utilisateur,
    nom_complet,
    role,
    statut,
    cree_le
FROM utilisateurs
ORDER BY cree_le DESC;

-- Résultat attendu : Au moins 1 ligne avec nom_utilisateur = 'admin'
-- Si vide : Vous devez exécuter l'INSERT (voir CREATION_COMPTE_DETAILLE.md étape 3)

-- ============================================================================

-- 4. Vérifier la liaison auth.users <-> utilisateurs
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    u.nom_utilisateur,
    u.nom_complet,
    u.role,
    u.statut
FROM auth.users au
LEFT JOIN utilisateurs u ON u.id = au.id
ORDER BY au.created_at DESC;

-- Résultat attendu :
--   - Si tout est bon : Une ligne avec toutes les colonnes remplies
--   - Si utilisateur existe dans auth mais pas dans utilisateurs :
--     Vous verrez l'email mais nom_utilisateur sera NULL
--   - Si vide : Aucun utilisateur créé

-- ============================================================================

-- 5. Vérifier les politiques RLS sur utilisateurs
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'utilisateurs'
ORDER BY policyname;

-- Résultat attendu : Plusieurs politiques (Les utilisateurs peuvent voir..., etc.)

-- ============================================================================

-- 6. Vérifier le plan comptable (devrait être pré-rempli)
SELECT
    code_ohada,
    libelle,
    type_compte
FROM plan_comptable
ORDER BY code_ohada;

-- Résultat attendu : 8 lignes avec les comptes OHADA (411, 422, 401, etc.)

-- ============================================================================

-- 7. Vérifier le nombre d'enregistrements dans chaque table
SELECT
    'utilisateurs' as table_name,
    COUNT(*) as nb_records
FROM utilisateurs
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'sites', COUNT(*) FROM sites
UNION ALL
SELECT 'factures_clients', COUNT(*) FROM factures_clients
UNION ALL
SELECT 'plan_comptable', COUNT(*) FROM plan_comptable
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- Résultat attendu :
--   utilisateurs      : 1 (ou plus si vous avez créé d'autres comptes)
--   clients           : 0 (vide au départ)
--   sites             : 0 (vide au départ)
--   factures_clients  : 0 (vide au départ)
--   plan_comptable    : 8 (pré-rempli)
--   auth.users        : 1 (ou plus)

-- ============================================================================
-- DIAGNOSTIC
-- ============================================================================

-- Si auth.users = 0 ET utilisateurs = 0
--   → Vous devez créer l'utilisateur dans Supabase Dashboard
--   → Suivez CREATION_COMPTE_DETAILLE.md depuis l'étape 1

-- Si auth.users > 0 ET utilisateurs = 0
--   → L'utilisateur Auth existe mais pas l'entrée utilisateurs
--   → Suivez CREATION_COMPTE_DETAILLE.md étape 3 (INSERT)

-- Si auth.users > 0 ET utilisateurs > 0 mais connexion échoue
--   → Vérifiez que email_confirmed_at n'est pas NULL
--   → Vérifiez le mot de passe : Admin@GAS2026!
--   → Vérifiez que statut = 'ACTIF'

-- ============================================================================
