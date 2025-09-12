import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage.js";
import { insertStudySessionSchema, insertPracticeResultSchema, insertStudyPlanSchema, insertWordSchema, insertUserSchema } from "../shared/schema.js";
import passport, { hashPassword } from './auth.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      if (header === 'difficulty' || header === 'frequency') {
        obj[header] = parseInt(value) || 1;
      } else {
        obj[header] = value;
      }
    });
    
    if (obj.word && obj.phonetic && obj.partOfSpeech && obj.chineseDefinition) {
      data.push(obj);
    }
  }
  
  return data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/signup', async (req, res, next) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
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
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid'); // Assuming the default session cookie name
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Words API

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

  app.post("/api/words", async (req, res) => {
    try {
      console.log("POST /api/words - Request body:", JSON.stringify(req.body, null, 2));
      const result = insertWordSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.issues);
        return res.status(400).json({ 
          message: "Invalid word data", 
          errors: result.error.issues 
        });
      }
      
      const word = await storage.createWord(result.data);
      console.log("Word created successfully:", word.id);
      res.json(word);
    } catch (error) {
      console.error("Error creating word:", error);
      res.status(500).json({ message: "Failed to create word" });
    }
  });

  app.post("/api/words/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const fileName = req.file.originalname.toLowerCase();
      
      let wordsData: any[] = [];
      
      if (fileName.endsWith('.csv')) {
        wordsData = parseCSV(fileContent);
      } else if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(fileContent);
          wordsData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return res.status(400).json({ message: "Invalid JSON format" });
        }
      } else {
        return res.status(400).json({ message: "Unsupported file format" });
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const wordData of wordsData) {
        try {
          const result = insertWordSchema.safeParse(wordData);
          if (result.success) {
            await storage.createWord(result.data);
            successCount++;
          } else {
            failedCount++;
            errors.push(`Word "${wordData.word || 'unknown'}": ${result.error.issues.map(i => i.message).join(', ')}`);
          }
        } catch (error) {
          failedCount++;
          errors.push(`Word "${wordData.word || 'unknown'}": Failed to create`);
        }
      }

      res.json({
        success: successCount,
        failed: failedCount,
        total: wordsData.length,
        errors: errors.slice(0, 10) // Return first 10 errors only
      });

    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import words" });
    }
  });

  app.get("/api/words/:id", async (req, res) => {
    try {
      const word = await storage.getWord(req.params.id);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      
      const progress = await storage.getUserProgress(req.params.id);
      res.json({ ...word, progress });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch word" });
    }
  });

  // Progress API
  app.post("/api/progress/:wordId", async (req, res) => {
    try {
      const { wordId } = req.params;
      const progressData = req.body;
      
      const updatedProgress = await storage.updateUserProgress(wordId, progressData);
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get("/api/words-for-review", async (req, res) => {
    try {
      const words = await storage.getWordsForReview();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review words" });
    }
  });

  // Study Sessions API
  app.post("/api/study-sessions", async (req, res) => {
    try {
      const result = insertStudySessionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid session data" });
      }
      
      const session = await storage.createStudySession(result.data);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  // Practice API
  app.post("/api/practice-results", async (req, res) => {
    try {
      const result = insertPracticeResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid practice result data" });
      }
      
      const practiceResult = await storage.savePracticeResult(result.data);
      res.json(practiceResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to save practice result" });
    }
  });

  // Study Plans API
  app.post("/api/study-plans", async (req, res) => {
    try {
      const result = insertStudyPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid study plan data" });
      }
      
      const plan = await storage.createStudyPlan(result.data);
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create study plan" });
    }
  });

  app.get("/api/study-plans/active", async (req, res) => {
    try {
      const plan = await storage.getActiveStudyPlan();
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active study plan" });
    }
  });

  app.patch("/api/study-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedPlan = await storage.updateStudyPlan(id, updates);
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update study plan" });
    }
  });

  // Dashboard API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Word Collections API
  app.get("/api/vocabulary-book", async (req, res) => {
    try {
      const words = await storage.getVocabularyBook();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary book" });
    }
  });

  app.get("/api/starred-words", async (req, res) => {
    try {
      const words = await storage.getStarredWords();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch starred words" });
    }
  });

  app.post("/api/words/:id/star", async (req, res) => {
    try {
      await storage.toggleWordStar(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle star" });
    }
  });

  app.post("/api/words/:id/add-to-vocabulary", async (req, res) => {
    try {
      await storage.addToVocabularyBook(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to vocabulary book" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
