# Guide Détaillé - Création du Compte Administrateur

## Problème Actuel
La base de données ne contient aucun utilisateur. Vous devez créer le compte manuellement via le Dashboard Supabase.

---

## Solution : Créer le Compte via Dashboard Supabase

### Étape 1 : Accéder à Supabase

1. Ouvrez votre navigateur
2. Allez sur : https://supabase.com/dashboard
3. Connectez-vous à votre compte Supabase
4. Sélectionnez votre projet (celui avec l'URL : `yfnrmwvfxpklnofkcdjj`)

### Étape 2 : Créer l'Utilisateur Auth

1. Dans le menu de gauche, cliquez sur **"Authentication"** (icône de cadenas)
2. Cliquez sur **"Users"** dans le sous-menu
3. Vous devriez voir une page vide avec "0 users"
4. Cliquez sur le bouton vert **"Add user"** ou **"Invite"** en haut à droite
5. Sélectionnez **"Create new user"**

6. Remplissez le formulaire :
   ```
   Email: admin@goaheadsecurity.com
   Password: Admin@GAS2026!
   ```

7. **IMPORTANT** : Cochez la case **"Auto Confirm User"**
   - Cette option confirme automatiquement l'email
   - Sans cela, l'utilisateur ne pourra pas se connecter

8. Cliquez sur **"Create user"**

9. **TRÈS IMPORTANT** : Une fois l'utilisateur créé, vous verrez une liste avec votre utilisateur
   - Cliquez sur l'utilisateur pour voir ses détails
   - **COPIEZ L'UUID** (l'identifiant qui ressemble à : `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - Vous en aurez besoin pour l'étape suivante

### Étape 3 : Créer l'Entrée dans la Table utilisateurs

1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"** (en haut à droite)
3. Copiez et collez ce SQL (en remplaçant `VOTRE_UUID_ICI`) :

```sql
-- Remplacez 'VOTRE_UUID_ICI' par l'UUID que vous avez copié à l'étape 2
INSERT INTO utilisateurs (
    id,
    nom_utilisateur,
    mot_de_passe_hash,
    nom_complet,
    role,
    statut
) VALUES (
    'VOTRE_UUID_ICI',  -- ← REMPLACEZ ICI
    'admin',
    'managed_by_supabase_auth',
    'Administrateur Principal',
    'ADMIN',
    'ACTIF'
);
```

4. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Entrée / Cmd+Entrée)
5. Vous devriez voir : **"Success. No rows returned"** ou **"1 row inserted"**

### Étape 4 : Vérifier la Création

Dans le SQL Editor, exécutez cette requête pour vérifier :

```sql
SELECT
    u.nom_utilisateur,
    u.nom_complet,
    u.role,
    u.statut,
    au.email,
    au.email_confirmed_at
FROM utilisateurs u
JOIN auth.users au ON au.id = u.id;
```

Vous devriez voir une ligne avec :
- nom_utilisateur : admin
- email : admin@goaheadsecurity.com
- role : ADMIN
- statut : ACTIF
- email_confirmed_at : une date (pas NULL)

---

## Se Connecter à l'Application

1. Lancez l'application Guardian Command (npm run dev)
2. Vous verrez l'écran de connexion avec le logo GO AHEAD SECURITY
3. Entrez :
   ```
   Email : admin@goaheadsecurity.com
   Mot de passe : Admin@GAS2026!
   ```
4. Cliquez sur "Se connecter"

Vous serez connecté en tant qu'administrateur avec accès complet à tous les modules.

---

## Dépannage

### Erreur "Invalid login credentials"

**Cause 1 : L'email n'est pas confirmé**
- Solution : Vérifiez que vous avez coché "Auto Confirm User" à l'étape 2.7
- Vérifiez dans SQL que `email_confirmed_at` n'est pas NULL

**Cause 2 : Le mot de passe est incorrect**
- Vérifiez que vous avez bien entré : `Admin@GAS2026!`
- Attention aux majuscules/minuscules
- Le mot de passe contient : A majuscule, @ arobase, G majuscule, A majuscule, S majuscule, 2026, et point d'exclamation

**Cause 3 : L'utilisateur n'existe pas dans auth.users**
- Retournez à l'étape 2 et créez l'utilisateur

### Erreur "User not found" ou page blanche

**Cause : L'entrée n'existe pas dans la table utilisateurs**
- L'utilisateur existe dans auth.users mais pas dans la table utilisateurs
- Retournez à l'étape 3 et exécutez l'INSERT
- Vérifiez que l'UUID correspond EXACTEMENT

### Je ne trouve pas l'UUID

1. Allez dans Authentication > Users
2. Cliquez sur l'utilisateur admin@goaheadsecurity.com
3. L'UUID est affiché en haut : "User UID: xxxxx-xxxx-xxxx"
4. Ou exécutez ce SQL :
```sql
SELECT id FROM auth.users WHERE email = 'admin@goaheadsecurity.com';
```

### L'application ne démarre pas

```bash
# Assurez-vous que les dépendances sont installées
npm install

# Lancez l'application
npm run dev
```

---

## Méthode Alternative : Créer via cURL

Si vous êtes à l'aise avec la ligne de commande :

```bash
# Note : Nécessite d'avoir la clé service_role (non fournie pour sécurité)
# Utilisez plutôt la méthode Dashboard ci-dessus
```

---

## Besoin d'Aide ?

Si vous rencontrez toujours des problèmes après avoir suivi ces étapes :

1. Vérifiez que vous êtes bien connecté au bon projet Supabase
2. Vérifiez que les tables existent :
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   Vous devriez voir : utilisateurs, clients, sites, etc.

3. Vérifiez les permissions RLS :
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename = 'utilisateurs';
   ```

---

## Identifiants de Connexion (Rappel)

```
Email        : admin@goaheadsecurity.com
Mot de passe : Admin@GAS2026!
Rôle         : ADMIN
```

**Changez ce mot de passe en production !**
