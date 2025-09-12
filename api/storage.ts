import { DrizzleStorage } from "./drizzle-storage.js";
import type { User, Word, UserProgress, StudySession, PracticeResult, StudyPlan, InsertUser, InsertWord, InsertUserProgress, InsertStudySession, InsertPracticeResult, InsertStudyPlan, WordWithProgress, DashboardStats } from "../shared/schema.js";

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
  getUserProgress(wordId: string): Promise<UserProgress | undefined>;
  updateUserProgress(wordId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  getWordsForReview(): Promise<WordWithProgress[]>;
  getWordsByMasteryLevel(minLevel: number, maxLevel: number): Promise<WordWithProgress[]>;
  
  // Study sessions
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  getRecentStudySessions(limit: number): Promise<StudySession[]>;
  
  // Practice results
  savePracticeResult(result: InsertPracticeResult): Promise<PracticeResult>;
  getPracticeHistory(wordId: string): Promise<PracticeResult[]>;
  
  // Study plans
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getActiveStudyPlan(): Promise<StudyPlan | undefined>;
  updateStudyPlan(id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Word collections
  getVocabularyBook(): Promise<WordWithProgress[]>;
  getStarredWords(): Promise<WordWithProgress[]>;
  toggleWordStar(wordId: string): Promise<void>;
  addToVocabularyBook(wordId: string): Promise<void>;
}

// Export an instance of the DrizzleStorage to be used by the application
export const storage = new DrizzleStorage();
