import express from "express";
import session from "express-session";
import passport from "./auth.js";
import { registerRoutes } from "./routes.js";
import connectPgSimple from 'connect-pg-simple';

// Create the Express app
const app = express();

// Trust the Vercel proxy
app.set('trust proxy', true);

// The express.json() middleware is needed to parse JSON request bodies
app.use(express.json());

// Session configuration
if (!process.env.SESSION_SECRET) {
  // In a real app, you'd want to handle this more gracefully.
  // For this project, we'll assume it's set in the environment.
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

// Register all API routes
registerRoutes(app);

// Vercel exports the Express app instance as the default handler
export default app;

// Start the server only when running in a local development environment
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}
