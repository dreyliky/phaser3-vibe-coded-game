# Project Structure (`src/`)

- **config/**: `config.ts`, `constants.ts`.
- **scenes/**: Separate file per scene (Boot, Menu, Game, HUD).
- **objects/**: Game entities (characters, items, UI). Create new files here, don't clutter scenes.
- **services/**: Global systems (EventBus, Storage).
- **utils/**: Pure helpers.
- **types/**: Shared definitions.
