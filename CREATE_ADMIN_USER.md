# Créer un Compte Administrateur - Guardian Command

## Identifiants du Compte

Voici les identifiants qui seront créés :

```
Email    : admin@goaheadsecurity.com
Mot de passe : Admin@GAS2026!
Rôle     : ADMIN
Nom      : Administrateur Principal
```

---

## Étapes de Création (Via Dashboard Supabase)

### 1. Accéder au Dashboard Supabase

1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez le projet : **yfnrmwvfxpklnofkcdjj**

### 2. Créer l'Utilisateur Auth

1. Dans le menu de gauche, cliquez sur **Authentication**
2. Cliquez sur **Users**
3. Cliquez sur le bouton **Add User** (en haut à droite)
4. Remplissez le formulaire :
   - **Email** : `admin@goaheadsecurity.com`
   - **Password** : `Admin@GAS2026!`
   - **Auto Confirm User** : ✓ (cochez cette case)
5. Cliquez sur **Create User**
6. **IMPORTANT** : Copiez l'**UUID** de l'utilisateur créé (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Créer l'Entrée dans la Table utilisateurs

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query**
3. Collez ce SQL (en remplaçant `VOTRE_UUID_ICI` par l'UUID copié) :

```sql
INSERT INTO utilisateurs (
    id,
    nom_utilisateur,
    mot_de_passe_hash,
    nom_complet,
    role,
    statut
) VALUES (
    'VOTRE_UUID_ICI',  -- Remplacez par l'UUID de l'étape 2
    'admin',
    'managed_by_supabase_auth',
    'Administrateur Principal',
    'ADMIN',
    'ACTIF'
);
```

4. Cliquez sur **Run** pour exécuter la requête

### 4. Vérification

Exécutez cette requête pour vérifier :

```sql
SELECT
    u.id,
    u.nom_utilisateur,
    u.nom_complet,
    u.role,
    u.statut,
    au.email,
    au.email_confirmed_at
FROM utilisateurs u
JOIN auth.users au ON au.id = u.id
WHERE u.nom_utilisateur = 'admin';
```

Vous devriez voir une ligne avec toutes les informations.

---

## Se Connecter à l'Application

1. Lancez l'application Guardian Command
2. Sur l'écran de connexion, entrez :
   - **Email** : `admin@goaheadsecurity.com`
   - **Mot de passe** : `Admin@GAS2026!`
3. Cliquez sur **Se connecter**

Vous serez connecté avec les privilèges d'administrateur complet.

---

## Méthode Alternative (Via SQL uniquement)

Si vous préférez tout faire en SQL :

```sql
-- Note : Cette méthode nécessite des droits admin sur Supabase

-- 1. Créer l'utilisateur Auth (via API REST ou Dashboard)
-- Ceci doit être fait via le Dashboard comme décrit ci-dessus

-- 2. Après avoir copié l'UUID, insérer dans utilisateurs
INSERT INTO utilisateurs (
    id,
    nom_utilisateur,
    mot_de_passe_hash,
    nom_complet,
    role,
    statut
) VALUES (
    'UUID_COPIE_DU_DASHBOARD',
    'admin',
    'managed_by_supabase_auth',
    'Administrateur Principal',
    'ADMIN',
    'ACTIF'
);
```

---

## Créer des Utilisateurs Supplémentaires

Pour créer d'autres utilisateurs avec différents rôles, répétez les mêmes étapes avec ces informations :

### Utilisateur Finance
```
Email : finance@goaheadsecurity.com
Mot de passe : Finance@GAS2026!
Rôle : FINANCE
Nom : Responsable Financier
```

### Utilisateur Operations
```
Email : operations@goaheadsecurity.com
Mot de passe : Operations@GAS2026!
Rôle : OPS_MANAGER
Nom : Responsable Opérations
```

### Utilisateur CEO
```
Email : ceo@goaheadsecurity.com
Mot de passe : CEO@GAS2026!
Rôle : CEO
Nom : Directeur Général
```

### Utilisateur Supervisor
```
Email : supervisor@goaheadsecurity.com
Mot de passe : Supervisor@GAS2026!
Rôle : SUPERVISOR
Nom : Superviseur de Terrain
```

---

## Permissions par Rôle

| Rôle | Accès Module Finance | Accès RH | Accès Opérations |
|------|---------------------|----------|------------------|
| **ADMIN** | Complet | Complet | Complet |
| **CEO** | Lecture seule | Lecture seule | Lecture seule |
| **FINANCE** | Complet | Lecture | Lecture |
| **OPS_MANAGER** | Sites seulement | Complet | Complet |
| **SUPERVISOR** | Aucun | Lecture limitée | Terrain seulement |

---

## Dépannage

### Erreur "Email already registered"
- L'email existe déjà dans Supabase Auth
- Utilisez un autre email ou supprimez l'utilisateur existant

### Erreur "Invalid UUID"
- Vérifiez que vous avez bien copié l'UUID complet
- L'UUID doit avoir le format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erreur "Role violates check constraint"
- Le rôle doit être exactement : ADMIN, CEO, FINANCE, OPS_MANAGER, ou SUPERVISOR
- Vérifiez l'orthographe et les majuscules

### Impossible de se connecter
1. Vérifiez que l'email est confirmé dans Supabase Auth
2. Vérifiez que l'utilisateur existe dans la table `utilisateurs`
3. Vérifiez que le statut est 'ACTIF'

---

## Sécurité

### En Production
- **Changez tous les mots de passe par défaut**
- Utilisez des mots de passe uniques et complexes
- Activez l'authentification à deux facteurs (2FA)
- Ne partagez jamais les identifiants par email non chiffré

### Mots de Passe Recommandés
- Minimum 12 caractères
- Majuscules et minuscules
- Chiffres
- Caractères spéciaux
- Unique par utilisateur

---

**Date de création** : 02 Janvier 2026
**Version** : 2.0
**Support** : info@goaheadsecurity.com
