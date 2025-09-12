import { DrizzleStorage } from "./drizzle-storage.js";

// This file is responsible for creating and exporting the singleton instance of our storage.
// This avoids circular dependencies between storage, drizzle-storage, and other files.
export const storage = new DrizzleStorage();
