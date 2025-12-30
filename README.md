# Go Ahead Security

A comprehensive security company management system that runs both as a web application and as a cross-platform desktop application.

## Features

- Employee Management (HR)
- Client Management
- Site Management & Patrol Routes
- Dashboard with Real-time Statistics
- Runs as Web App or Desktop Application (Windows, Mac, Linux)

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

## Project Structure

```
.
├── electron/          # Electron main process files
│   ├── main.js       # Main process entry point
│   └── preload.js    # Preload script for security
├── src/              # React application source
├── dist/             # Built web assets
└── dist-electron/    # Built Electron files
```

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
