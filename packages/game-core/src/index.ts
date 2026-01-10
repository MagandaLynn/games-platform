// packages/game-core/src/index.ts
export * as games from "./games";

// optional: shared utils/types you want public later
// export * from "./shared/types";
import { games } from "@playseed/game-core";
// replace hardcoded date with seed
games.wurple.createInitialState("2026-01-06");

