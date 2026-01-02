# Guardian Command - GO AHEAD SECURITY

Système de gestion ERP pour entreprise de sécurité privée. Fonctionne comme application web et application desktop multi-plateformes.

## Phases 1 & 2 - Module Finance (Actuel)

### Phase 1 - Gestion des Tiers
- Gestion des Clients (Personnes Morales et Physiques)
- Gestion des Sites de Sécurité
- Tableau de Bord avec Statistiques en Temps Réel

### Phase 2 - Facturation
- Création et Gestion des Factures
- Lignes de Facturation par Site
- Suivi du Statut des Paiements (Brouillon, Envoyé, Payé)
- Gestion des Créances Antérieures
- Calcul Automatique des Totaux

### Infrastructure
- Authentification avec Contrôle d'Accès Basé sur les Rôles (RBAC)
- Base de Données Conforme aux Normes OHADA
- Application Web et Desktop (Windows, Mac, Linux)

## Development

### Web Application Mode
Start the web development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Desktop Application Mode
Start in Electron desktop mode:

```bash
npm run dev:electron
```

The application will open in an Electron window with hot-reload enabled.

## Building

### Web Application
Build for web deployment:
```bash
npm run build
```

### Desktop Application

Build for current platform (unpacked):
```bash
npm run build:electron:dir
```

Build distributables for current platform:
```bash
npm run build:electron
```

This will create installers in the `release/` directory:
- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` and `.deb` packages

## Structure du Projet

```
.
├── electron/              # Fichiers processus principal Electron
│   ├── main.js           # Point d'entrée du processus principal
│   └── preload.js        # Script de préchargement pour la sécurité
├── src/
│   ├── components/
│   │   ├── Auth/         # Authentification
│   │   ├── Dashboard/    # Tableau de bord
│   │   ├── Finance/      # Module Finance (Phase 1)
│   │   └── Layout/       # Composants de mise en page
│   ├── contexts/         # Contextes React (Auth)
│   ├── lib/              # Bibliothèques (Supabase)
│   └── types/            # Définitions TypeScript
├── supabase/
│   └── migrations/       # Migrations de base de données
├── dist/                 # Assets web compilés
└── dist-electron/        # Fichiers Electron compilés
```

## Stack Technologique

- **Electron**: Framework d'application desktop
- **React 18**: Framework UI avec TypeScript
- **Vite**: Outil de build et serveur de développement
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Bibliothèque d'icônes
- **Supabase**: Backend (PostgreSQL + Auth + API REST)

## Prochaines Phases

- **Phase 3**: Module Ressources Humaines (gestion employés, paie)
- **Phase 4**: Module Opérations (planning, flotte, matériel)
- **Phase 5**: Module Paie & Discipline (moteur de paie, actions disciplinaires)

Pour plus de détails, consultez `RESUME_IMPLEMENTATION.md` et `GUIDE_MODULE_FINANCE.md`.
