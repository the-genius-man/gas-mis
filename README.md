# Go Ahead Security - Management Information System (GAS-MIS)

A comprehensive security company management system built with React, TypeScript, Electron, and SQLite for offline operation.

## Features

- **Employee Management**: Complete HR system with certifications, performance tracking
- **Client Management**: Contract management and billing information
- **Site Management**: Security site locations with patrol routes and assignments
- **Dashboard Analytics**: Real-time statistics and KPIs
- **Offline Operation**: Local SQLite database for complete offline functionality
- **Desktop Application**: Cross-platform Electron app for Windows, Mac, and Linux

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron with secure IPC communication
- **Database**: SQLite with better-sqlite3
- **Build Tools**: Vite, Electron Builder
- **Icons**: Lucide React

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gas-mis
```

2. Install dependencies:
```bash
npm install
```

3. Rebuild native modules for Electron:
```bash
npx electron-rebuild
```

### Development Commands

```bash
# Start web development server
npm run dev

# Start Electron development (with hot reload)
npm run electron-dev

# Build for production
npm run build

# Build Electron app for distribution
npm run electron-pack

# Lint code
npm run lint
```

## Database

The application uses SQLite for local data storage with the following tables:

- `employees` - Employee information and HR data
- `clients` - Client contracts and contact information  
- `sites` - Security site locations and requirements
- `certifications` - Employee certifications and expiry tracking
- `site_assignments` - Guard assignments to sites
- `attendance_records` - Time tracking and attendance

### Sample Data

When running the Electron app for the first time, you can load sample data using the "Charger Données d'Exemple" button on the dashboard.

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard/       # Dashboard and analytics
│   ├── HR/             # Employee management
│   ├── Operations/     # Client and site management
│   └── Layout/         # Navigation and layout
├── contexts/           # React Context for state management
├── services/           # Database and API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and sample data

public/
├── electron.cjs        # Electron main process
└── preload.cjs         # Electron preload script

scripts/
└── seed-database.cjs   # Database seeding script
```

## Building for Production

### Web Version
```bash
npm run build
```

### Desktop Application
```bash
npm run electron-pack
```

This will create distributables in the `dist-electron` directory for your platform.

### Cross-Platform Builds

To build for multiple platforms, you can use electron-builder with platform-specific commands:

```bash
# Windows
npm run electron-pack -- --win

# macOS  
npm run electron-pack -- --mac

# Linux
npm run electron-pack -- --linux
```

## Deployment

### Local Installation
1. Build the Electron app: `npm run electron-pack`
2. Install the generated installer from `dist-electron/`
3. The app will run completely offline with local SQLite database

### Network Deployment
For multi-user environments, you can:
1. Deploy the web version to a server
2. Set up a shared database (PostgreSQL/MySQL)
3. Update the database service to use network endpoints

## Security Features

- Secure IPC communication between Electron processes
- Context isolation enabled
- Node integration disabled in renderer
- Local data storage with no external dependencies

## License

[Add your license information here]

## Support

For support and questions, contact [your-email@domain.com]
