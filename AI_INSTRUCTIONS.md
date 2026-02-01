# AI Instructions & Project Guidelines

This document serves as a reference for AI agents working on this project. It outlines the project structure, coding standards, and architectural preferences to ensure consistency and maintainability.

## Project Overview
- **Framework**: Phaser 3
- **Language**: TypeScript
- **Build Tool**: Vite

## Core Principles

### 1. Code Organization & Best Practices
- **Separation of Concerns**: Keep game logic, presentation, and data separate where possible.
- **Single Responsibility**: Each file should ideally export a single class or a set of closely related functions. Avoid "God classes" (monolithic files).
- **Modularity**: Break down complex entities into smaller, reusable components or separate files.
- **Strict Typing**: Leverage TypeScript's type system. Avoid `any` unless absolutely necessary. Define interfaces for game object properties and config objects.
- **Barrel Exports**: Use `index.ts` files in directories (e.g., `src/scenes/index.ts`, `src/objects/index.ts`) to export modules. This simplifies imports in other files.
- **Meaningful Comments**: Do not add redundant comments (e.g., `// Set x to 5`). Only comment complex logic, algorithms, or non-obvious workarounds. Code should be self-documenting.

### 2. File & Folder Architecture
We strictly follow a modular directory structure. All source code resides in `src/`.

```
phaser3-game/
├── public/                 # Static assets (images, audio, maps, etc.)
│   ├── assets/             # Main assets directory
│   │   ├── sprites/        # Character sprites, objects, etc.
│   │   ├── audio/          # Music and sound effects
│   │   ├── tilemaps/       # JSON maps and tilesets
│   │   └── fonts/          # Custom fonts (bitmap or webfonts)
│   └── ...
├── src/
│   ├── config/             # Game configuration and constants
│   │   ├── config.ts       # Main Phaser GameConfig
│   │   └── constants.ts    # Global constants (keys, physics values, colors)
│   ├── scenes/             # Phaser Scenes (one file per scene)
│   │   ├── Boot.ts         # Preload assets, setup registry
│   │   ├── MainMenu.ts     # Main menu interface
│   │   ├── Game.ts         # Main gameplay loop
│   │   └── HUD.ts          # UI overlay scene
│   ├── objects/            # Game Objects (Prefabs)
│   │   ├── characters/     # Player, Enemies, NPCs
│   │   │   ├── Player.ts
│   │   │   └── Enemy.ts
│   │   ├── items/          # Collectibles, weapons
│   │   └── ui/             # Reusable UI elements (Buttons, Bars)
│   ├── services/           # Global managers/systems
│   │   ├── EventBus.ts     # Global event emitter
│   │   └── Storage.ts      # Save/Load logic
│   ├── utils/              # Pure helper functions
│   ├── types/              # Shared TypeScript interfaces and types
│   └── main.ts             # Application entry point
├── index.html              # HTML entry point
├── package.json
└── tsconfig.json
```

## Development Workflow
1. **Adding New Entities**: When adding a new game object (e.g., a new enemy type), create a new file in `src/objects/` rather than adding to the Scene file.
2. **Asset Management**: Place raw assets in `public/assets/` subdirectories (e.g., `public/assets/sprites/`). Load them in a `Boot` or `Preload` scene using the path `assets/sprites/filename.png`.
3. **Clean Code**: Ensure unused imports are removed and code is formatted consistently.
