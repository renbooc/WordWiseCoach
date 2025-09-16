import type { DrizzleStorage } from "./drizzle-storage.js";
import type { User, Word, UserProgress, StudySession, PracticeResult, StudyPlan, InsertUser, InsertWord, InsertUserProgress, InsertStudySession, InsertPracticeResult, InsertStudyPlan, WordWithProgress, DashboardStats } from "../shared/schema.js";

// All type imports are used here to define the interface for our storage layer.
// This ensures that both MemStorage (for testing) and DrizzleStorage (for production)
// have the same methods.
export interface IStorage {
  // User management
  findUserByEmail(email: string): Promise<User | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Word management
  getAllWords(): Promise<Word[]>;
  getWordsByCategory(category: string): Promise<Word[]>;
  getWord(id: string): Promise<Word | undefined>;
  searchWords(query: string): Promise<Word[]>;
  createWord(word: InsertWord): Promise<Word>;
  
  // User progress
  getUserProgress(userId: string, wordId: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, wordId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  getWordsForReview(userId: string): Promise<WordWithProgress[]>;
  getWordsByMasteryLevel(userId: string, minLevel: number, maxLevel: number): Promise<WordWithProgress[]>;
  getNewWordsForPlan(userId: string, category: string, limit: number): Promise<Word[]>;
  
  // Study sessions
  createStudySession(session: InsertStudySession & { userId: string }): Promise<StudySession>;
  getStudySession(userId: string, sessionId: string): Promise<StudySession | undefined>;
  updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession>;
  getRecentStudySessions(userId: string, limit: number): Promise<StudySession[]>;
  
  // Practice results
  savePracticeResult(result: InsertPracticeResult): Promise<PracticeResult>;
  getPracticeHistory(userId: string, wordId: string): Promise<PracticeResult[]>;
  
  // Study plans
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getActiveStudyPlan(userId: string): Promise<StudyPlan | undefined>;
  updateStudyPlan(userId: string, id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan>;
  
  // Dashboard
  getDashboardStats(userId: string): Promise<DashboardStats>;
  
  // Vocabulary management
  getVocabularyBook(userId: string): Promise<WordWithProgress[]>;
  getStarredWords(userId: string): Promise<WordWithProgress[]>;
  toggleWordStar(userId: string, wordId: string): Promise<void>;
  addToVocabularyBook(userId: string, wordId: string): Promise<void>;
}

// We are declaring a global instance of our storage, but initializing it elsewhere.
// This allows the storage implementation to be swapped easily.
export declare const storage: IStorage;