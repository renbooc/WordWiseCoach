import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { storage } from "./storage-instance.js";
import { signupSchema, insertWordSchema, insertStudySessionSchema, insertPracticeResultSchema, insertStudyPlanSchema } from "../shared/schema.js";
import type { User } from "../shared/schema.js";
import passport, { hashPassword } from './auth.js';

import type { User as SchemaUser } from "../shared/schema.js";

// Extend the Express Request type to include our User object from the schema
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends SchemaUser {}
  }
}

// Middleware to check if the user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
};


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function registerRoutes(app: Express) {
  // ===== AUTHENTICATION =====
  app.post('/api/auth/signup', async (req, res, next) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: validation.error.issues });
      }
      const { email, password } = validation.data;
      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ email, hashedPassword });
      req.login(user, (err) => {
        if (err) return next(err);
        const { hashedPassword, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const { hashedPassword, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  app.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const { hashedPassword, ...userWithoutPassword } = req.user as User;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // ===== WORDS (Public) =====
  app.get("/api/words", async (req, res) => {
    try {
      const { category, search } = req.query;
      let words;
      if (search) {
        words = await storage.searchWords(search as string);
      } else if (category) {
        words = await storage.getWordsByCategory(category as string);
      } else {
        words = await storage.getAllWords();
      }
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch words" });
    }
  });

  // ===== WORD (Admin/Protected - for now, just authenticated) =====
  app.post("/api/words", isAuthenticated, async (req, res) => {
    try {
      const result = insertWordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid word data", errors: result.error.issues });
      }
      const word = await storage.createWord(result.data);
      res.json(word);
    } catch (error) {
      console.error("Error creating word:", error);
      res.status(500).json({ message: "Failed to create word" });
    }
  });

  app.post("/api/words/import", isAuthenticated, upload.single('file'), async (req, res) => {
    // ... (import logic remains the same for now)
  });

  // ===== USER-SPECIFIC DATA (Authenticated) =====

  app.get("/api/words/:id", isAuthenticated, async (req, res) => {
    try {
      const word = await storage.getWord(req.params.id);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      const progress = await storage.getUserProgress((req.user as User).id, req.params.id);
      res.json({ ...word, progress });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch word details" });
    }
  });

  app.post("/api/progress/:wordId", isAuthenticated, async (req, res) => {
    try {
      const { wordId } = req.params;
      const progressData = req.body;
      const updatedProgress = await storage.updateUserProgress((req.user as User).id, wordId, progressData);
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get("/api/words-for-review", isAuthenticated, async (req, res) => {
    try {
      const words = await storage.getWordsForReview((req.user as User).id);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review words" });
    }
  });

  app.post("/api/study-sessions", isAuthenticated, async (req, res) => {
    try {
      const result = insertStudySessionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid session data" });
      }
      const session = await storage.createStudySession({ ...result.data, userId: (req.user as User).id });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  app.post("/api/practice-results", isAuthenticated, async (req, res) => {
    try {
      const result = insertPracticeResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid practice result data" });
      }
      const practiceResult = await storage.savePracticeResult({ ...result.data, userId: (req.user as User).id });
      res.json(practiceResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to save practice result" });
    }
  });

  app.post("/api/study-plans", isAuthenticated, async (req, res) => {
    try {
      const result = insertStudyPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid study plan data" });
      }
      const plan = await storage.createStudyPlan({ ...result.data, userId: (req.user as User).id });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study plan" });
    }
  });

  app.get("/api/study-plans/active", isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.getActiveStudyPlan((req.user as User).id);
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active study plan" });
    }
  });

  app.patch("/api/study-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedPlan = await storage.updateStudyPlan((req.user as User).id, id, updates);
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update study plan" });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats((req.user as User).id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/vocabulary-book", isAuthenticated, async (req, res) => {
    try {
      const words = await storage.getVocabularyBook((req.user as User).id);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary book" });
    }
  });

  app.get("/api/starred-words", isAuthenticated, async (req, res) => {
    try {
      const words = await storage.getStarredWords((req.user as User).id);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch starred words" });
    }
  });

  app.post("/api/words/:id/star", isAuthenticated, async (req, res) => {
    try {
      await storage.toggleWordStar((req.user as User).id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle star" });
    }
  });

  app.post("/api/words/:id/add-to-vocabulary", isAuthenticated, async (req, res) => {
    try {
      await storage.addToVocabularyBook((req.user as User).id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to vocabulary book" });
    }
  });
}
