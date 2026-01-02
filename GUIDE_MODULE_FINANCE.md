# Guide du Module Finance - Guardian Command

## Vue d'ensemble

Le Module Finance est le premier module du système Guardian Command ERP pour GO AHEAD SECURITY. Il implémente la gestion des clients, des sites et prépare la facturation conforme aux normes OHADA.

## Fonctionnalités Implémentées

### 1. Authentification Sécurisée
- Système de connexion basé sur Supabase Auth
- Gestion des rôles utilisateurs (RBAC) :
  - **ADMIN** : Accès complet au système
  - **CEO** : Accès en lecture sur tous les modules
  - **FINANCE** : Gestion complète du module Finance
  - **OPS_MANAGER** : Gestion des opérations et sites
  - **SUPERVISOR** : Accès limité aux opérations terrain
- Déconnexion automatique après 15 minutes d'inactivité

### 2. Gestion des Clients
- Création et modification de clients (Personnes Morales ou Physiques)
- Informations complètes :
  - Identifiants légaux (NIF, RCCM, ID National)
  - Contacts principal et d'urgence
  - Informations de facturation
  - Conditions de paiement personnalisées
- Recherche et filtrage avancés
- Interface intuitive avec cartes d'information

### 3. Gestion des Sites
- Création et gestion des sites de sécurité
- Informations détaillées :
  - Localisation (adresse, GPS)
  - Effectifs requis (jour/nuit)
  - Tarification (tarif client et taux garde)
  - Consignes de sécurité spécifiques
- Liaison directe avec les clients
- Statut actif/inactif pour chaque site

### 4. Base de Données (Normes OHADA)
- Tables structurées selon les spécifications :
  - `utilisateurs` : Gestion des accès
  - `clients` : Entités contractuelles
  - `sites` : Lieux physiques sécurisés
  - `plan_comptable` : Comptes OHADA pré-configurés
  - `factures_clients` : Prêt pour la facturation
  - `audit_logs` : Journal d'audit complet
- Politiques RLS (Row Level Security) strictes
- Support multi-devises (USD, CDF, EUR)

## Structure Technique

### Technologies Utilisées
- **Frontend** : React 18 + TypeScript + Vite
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **UI** : Tailwind CSS + Lucide Icons
- **Déploiement** : Electron (desktop) ou Web

### Architecture des Fichiers
```
src/
├── components/
│   ├── Auth/
│   │   └── Login.tsx
│   ├── Finance/
│   │   ├── FinanceModule.tsx      # Module principal
│   │   ├── ClientsManagement.tsx  # Gestion clients
│   │   ├── ClientForm.tsx         # Formulaire client
│   │   ├── SitesManagement.tsx    # Gestion sites
│   │   └── SiteForm.tsx           # Formulaire site
│   └── Layout/
│       ├── Header.tsx             # En-tête avec menu user
│       └── Sidebar.tsx            # Navigation latérale
├── contexts/
│   ├── AuthContext.tsx            # Contexte d'authentification
│   └── AppContext.tsx             # État global
└── lib/
    └── supabase.ts                # Client Supabase
```

## Utilisation

### Première Connexion

1. **Créer un utilisateur admin** :
   ```sql
   -- Dans le dashboard Supabase, créer d'abord un utilisateur Auth
   -- Ensuite, exécuter cette requête SQL :

   INSERT INTO utilisateurs (id, nom_utilisateur, nom_complet, role, statut)
   VALUES (
     'UUID_DE_L_UTILISATEUR_AUTH',
     'admin',
     'Administrateur Principal',
     'ADMIN',
     'ACTIF'
   );
   ```

2. **Se connecter** :
   - Email : celui utilisé dans Supabase Auth
   - Mot de passe : celui défini dans Supabase Auth

### Gestion des Clients

1. Cliquer sur "Finance" dans la sidebar
2. L'onglet "Clients" est affiché par défaut
3. Cliquer sur "Nouveau Client" pour ajouter un client
4. Remplir le formulaire :
   - Type de client (Morale/Physique)
   - Raison sociale ou nom complet
   - Identifiants légaux (NIF recommandé)
   - Informations de contact
   - Paramètres de facturation

### Gestion des Sites

1. Dans le module Finance, cliquer sur l'onglet "Sites"
2. Cliquer sur "Nouveau Site"
3. Sélectionner un client existant
4. Remplir les informations :
   - Nom et localisation du site
   - Effectifs requis (jour/nuit)
   - Tarifs (client et garde)
   - Consignes de sécurité

## Sécurité

### Politiques d'Accès (RLS)
- **Clients** : Accès Finance, OPS_MANAGER, CEO
- **Sites** : Accès Finance, OPS_MANAGER, SUPERVISOR, CEO
- **Factures** : Accès Finance, CEO uniquement
- **Plan Comptable** : Lecture pour tous les utilisateurs authentifiés
- **Audit Logs** : Accès ADMIN et CEO uniquement

### Audit Trail
Toutes les modifications sont tracées dans la table `audit_logs` avec :
- Table et ID de l'enregistrement modifié
- Action (INSERT, UPDATE, DELETE)
- Anciennes et nouvelles valeurs (JSONB)
- Utilisateur et timestamp

## Prochaines Étapes

### Module Facturation (À venir)
- Génération automatique des factures mensuelles
- Calcul des créances antérieures
- Gestion des paiements
- Relevés de compte détaillés
- Export PDF des factures

### Module RH (À venir)
- Gestion des employés et gardes
- Calcul automatique de la paie
- Gestion des congés
- Documents d'employés
- Historique disciplinaire

### Module Opérations (À venir)
- Planning des rôteurs
- Affectations permanentes
- Gestion de la flotte
- Inventaire du matériel
- Actions disciplinaires

## Support et Contact

Pour toute question ou problème technique :
- Email : info@goaheadsecurity.com
- Slogan : "Leading the curve ahead"

---

**Version** : 2.0
**Date** : Janvier 2026
**Statut** : Module Finance Phase 1 Complété
