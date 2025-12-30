# Go Ahead Security - Desktop Application

A comprehensive security company management system built as an Electron desktop application.

## Features

- Employee Management (HR)
- Client Management
- Site Management & Patrol Routes
- Dashboard with Real-time Statistics
- Cross-platform Desktop Application (Windows, Mac, Linux)

## Development

Start the development server:

```bash
npm run dev
```

The application will open in an Electron window with hot-reload enabled.

## Building

### Build for current platform (unpacked):
```bash
npm run build:dir
```

### Build distributables for current platform:
```bash
npm run build
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
