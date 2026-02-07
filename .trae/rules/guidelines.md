# AI Project Rules: Phaser 3 & TypeScript

**Stack**: Phaser 3, TypeScript, Vite.

**Coding Standards**:
- **Strict Typing**: Use interfaces/types. Avoid `any`.
- **Modularity**: Single responsibility per file. No God classes. Use `index.ts` barrel exports.
- **Naming**: `kebab-case` for files, `PascalCase` for classes.
- **Comments**: Only for complex logic; code should be self-documenting.

**Structure (`src/`)**:
- **config/**: `config.ts`, `constants.ts`.
- **scenes/**: Separate file per scene (Boot, Menu, Game, HUD).
- **objects/**: Game entities (characters, items, UI). Create new files here, don't clutter scenes.
- **services/**: Global systems (EventBus, Storage).
- **utils/**: Pure helpers.
- **types/**: Shared definitions.

**Workflow**:
- **Assets**: Put in `public/assets/` (sprites, audio, etc.). Load in Boot scene.
- **Clean Code**: Remove unused imports/vars. Maintain consistent formatting.
