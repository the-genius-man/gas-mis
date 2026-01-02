# Go Ahead Security - Management Information System (GAS-MIS)

Système de gestion ERP complet pour entreprise de sécurité privée. Fonctionne comme application web avec Supabase et application desktop offline avec SQLite.

## Modes de Fonctionnement

### Mode Web (Supabase)
- Application web avec authentification
- Base de données PostgreSQL via Supabase
- Module Finance complet (Phases 1 & 2)
- Déploiement cloud

### Mode Desktop (Electron + SQLite)
- Application desktop multi-plateformes
- Base de données SQLite locale
- Fonctionnement 100% offline
- Modules HR, Operations, Sites complets

## Fonctionnalités

### Phase 1 & 2 - Module Finance (Web)
- **Gestion des Clients**: Personnes Morales et Physiques
- **Gestion des Sites**: Sites de sécurité avec tarification
- **Facturation**: Création et gestion des factures
- **Tableau de Bord**: Statistiques en temps réel

### Modules Complets (Desktop)
- **Employee Management**: Système RH complet avec certifications
- **Client Management**: Gestion des contrats et facturation
- **Site Management**: Emplacements avec routes de patrouille
- **Dashboard Analytics**: Statistiques et KPIs en temps réel

## Stack Technologique

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron avec communication IPC sécurisée
- **Web Backend**: Supabase (PostgreSQL + Auth + API REST)
- **Desktop Database**: SQLite avec better-sqlite3
- **Build Tools**: Vite, Electron Builder
- **Icons**: Lucide React

## Installation et Développement

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation
```bash
git clone <repository-url>
cd gas-mis
npm install
```

### Commandes de Développement

#### Mode Web (Supabase)
```bash
# Serveur de développement web
npm run dev

# Application disponible sur http://localhost:5173
```

#### Mode Desktop (Electron)
```bash
# Reconstruire les modules natifs pour Electron
npx electron-rebuild

# Développement Electron avec hot-reload
npm run electron-dev
```

### Autres Commandes
```bash
# Build pour production web
npm run build

# Build application desktop
npm run build:electron

# Build non-packagé (développement)
npm run build:electron:dir

# Lint du code
npm run lint
```

## Base de Données

### Mode Web (Supabase)
- PostgreSQL hébergé
- Authentification intégrée
- API REST automatique
- Migrations dans `supabase/migrations/`

### Mode Desktop (SQLite)
Tables principales:
- `employees` - Informations RH et employés
- `clients` - Contrats et informations clients
- `sites` - Emplacements et exigences de sécurité
- `certifications` - Certifications et dates d'expiration
- `site_assignments` - Affectations des gardes
- `attendance_records` - Suivi du temps et présence

## Structure du Projet

```
src/
├── components/
│   ├── Auth/             # Authentification (Web)
│   ├── Dashboard/        # Tableau de bord (Hybride)
│   ├── Finance/          # Module Finance (Web)
│   ├── HR/              # Gestion employés (Desktop)
│   ├── Operations/      # Gestion clients/sites (Desktop)
│   └── Layout/          # Navigation et mise en page
├── contexts/            # Contextes React (Auth + App)
├── services/            # Services base de données
├── lib/                 # Bibliothèques (Supabase)
├── types/               # Définitions TypeScript
└── utils/               # Utilitaires et données d'exemple

public/
├── electron.cjs         # Processus principal Electron
└── preload.cjs          # Script de préchargement

supabase/
└── migrations/          # Migrations base de données
```

## Déploiement

### Application Web
1. Build: `npm run build`
2. Déployer le dossier `dist/` sur votre serveur web
3. Configurer les variables d'environnement Supabase

### Application Desktop
1. Build: `npm run build:electron`
2. Installer depuis `release/` directory
3. Fonctionne complètement offline avec SQLite local

### Builds Multi-Plateformes
```bash
# Windows
npm run build:electron -- --win

# macOS  
npm run build:electron -- --mac

# Linux
npm run build:electron -- --linux
```

## Prochaines Phases

- **Phase 3**: Module Ressources Humaines (gestion employés, paie)
- **Phase 4**: Module Opérations (planning, flotte, matériel)  
- **Phase 5**: Module Paie & Discipline (moteur de paie, actions disciplinaires)

## Sécurité

- Communication IPC sécurisée (Electron)
- Isolation de contexte activée
- Intégration Node désactivée dans le renderer
- Authentification RBAC (Web)
- Stockage de données local sans dépendances externes (Desktop)

## Documentation

- `RESUME_IMPLEMENTATION.md` - Résumé de l'implémentation
- `GUIDE_MODULE_FINANCE.md` - Guide du module Finance
- `AUTH_FIX_SUMMARY.md` - Corrections d'authentification

## Support

Pour le support et les questions, contactez l'équipe de développement.
