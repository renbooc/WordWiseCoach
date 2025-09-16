import express from "express";
import session from "express-session";
import passport from "./auth.js";
import { registerRoutes } from "./routes.js";
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';

// Create the Express app
const app = express();

// --- PATH CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARE ---

// Trust the Vercel proxy
app.set('trust proxy', true);

// The express.json() middleware is needed to parse JSON request bodies
app.use(express.json());

// Session configuration
if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET environment variable is not set. Using a default for development.");
  process.env.SESSION_SECRET = "dev-secret";
}
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
}));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// --- API ROUTES ---
// Register all API routes
registerRoutes(app);

// --- FRONTEND SERVING (for integrated development/production) ---
if (process.env.NODE_ENV !== 'development') {
  const frontendDistPath = path.join(__dirname, '../../dist');
  app.use(express.static(frontendDistPath));

  // For any route that is not an API route, serve the index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Vercel exports the Express app instance as the default handler
export default app;

// Start the server only when running in a local development environment
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}