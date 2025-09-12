import express from "express";
import { registerRoutes } from "./routes.js";

// Create the Express app
const app = express();

// Vercel automatically parses the body, so no need for app.use(express.json());

// Register all API routes
registerRoutes(app);

// Vercel exports the Express app instance as the default handler
export default app;