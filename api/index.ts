import express from "express";
import { registerRoutes } from "./routes.js";

// Create the Express app
const app = express();

// The express.json() middleware is needed to parse JSON request bodies
app.use(express.json());

// Register all API routes
registerRoutes(app);

// Vercel exports the Express app instance as the default handler
export default app;