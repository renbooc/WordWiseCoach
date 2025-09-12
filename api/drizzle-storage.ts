import { db } from "./db.js";
import { type User, type Word, type UserProgress, type StudySession, type PracticeResult, type StudyPlan, type InsertUser, type InsertWord, type InsertUserProgress, type InsertStudySession, type InsertPracticeResult, type InsertStudyPlan, type WordWithProgress, type DashboardStats, users, words, userProgress, studySessions, practiceResults, studyPlans } from "../shared/schema.js";
import { IStorage } from "./storage.js";
import { eq, and, lte, gte, asc, desc, sql } from "drizzle-orm";

export class DrizzleStorage implements IStorage {
  // User management
  async findUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async findUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Word management
  async getAllWords(): Promise<Word[]> {
    return await db.select().from(words);
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    return await db.select().from(words).where(eq(words.category, category));
  }

  async getWord(id: string): Promise<Word | undefined> {
    const result = await db.select().from(words).where(eq(words.id, id));
    return result[0];
  }

  async searchWords(query: string): Promise<Word[]> {
    return await db.select().from(words).where(sql`word ILIKE ${`%${query}%`}`);
  }

  async createWord(word: InsertWord): Promise<Word> {
    const result = await db.insert(words).values(word).returning();
    return result[0];
  }
  
  // User progress
  async getUserProgress(wordId: string): Promise<UserProgress | undefined> {
    const result = await db.select().from(userProgress).where(eq(userProgress.wordId, wordId));
    return result[0];
  }

  async updateUserProgress(wordId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress> {
    const result = await db.insert(userProgress).values({ wordId, ...progress }).onConflictDoUpdate({ target: userProgress.wordId, set: progress }).returning();
    return result[0];
  }

  async getWordsForReview(): Promise<WordWithProgress[]> {
    const now = new Date();
    const results = await db.select().from(words)
      .leftJoin(userProgress, eq(words.id, userProgress.wordId))
      .where(lte(userProgress.nextReview, now));
    
    return results.map(r => ({ ...r.words, progress: r.user_progress || undefined }));
  }

  async getWordsByMasteryLevel(minLevel: number, maxLevel: number): Promise<WordWithProgress[]> {
    const results = await db.select().from(words)
      .leftJoin(userProgress, eq(words.id, userProgress.wordId))
      .where(and(gte(userProgress.masteryLevel, minLevel), lte(userProgress.masteryLevel, maxLevel)));

    return results.map(r => ({ ...r.words, progress: r.user_progress || undefined }));
  }
  
  // Study sessions
  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const result = await db.insert(studySessions).values(session).returning();
    return result[0];
  }

  async getRecentStudySessions(limit: number): Promise<StudySession[]> {
    return await db.select().from(studySessions).orderBy(desc(studySessions.createdAt)).limit(limit);
  }
  
  // Practice results
  async savePracticeResult(result: InsertPracticeResult): Promise<PracticeResult> {
    const res = await db.insert(practiceResults).values(result).returning();
    return res[0];
  }

  async getPracticeHistory(wordId: string): Promise<PracticeResult[]> {
    return await db.select().from(practiceResults).where(eq(practiceResults.wordId, wordId)).orderBy(desc(practiceResults.id));
  }
  
  // Study plans
  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const result = await db.insert(studyPlans).values(plan).returning();
    return result[0];
  }

  async getActiveStudyPlan(): Promise<StudyPlan | undefined> {
    const result = await db.select().from(studyPlans).where(eq(studyPlans.isActive, true));
    return result[0];
  }

  async updateStudyPlan(id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const result = await db.update(studyPlans).set(updates).where(eq(studyPlans.id, id)).returning();
    return result[0];
  }
  
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    // This is a complex query and might be better implemented with raw SQL or multiple queries for performance.
    // For now, we will return mock data.
    return {
      streakDays: 0,
      totalWordsLearned: 0,
      masteryRate: 0,
      todayStudyTime: 0,
      todayProgress: {
        newWords: { current: 0, target: 10 },
        review: { current: 0, target: 15 },
        listening: { current: 0, target: 8 },
      },
      reviewReminders: { urgent: 0, regular: 0, consolidation: 0 }
    };
  }
  
  // Word collections
  async getVocabularyBook(): Promise<WordWithProgress[]> {
    const results = await db.select().from(words)
      .leftJoin(userProgress, eq(words.id, userProgress.wordId))
      .where(eq(userProgress.isInVocabularyBook, true));
    return results.map(r => ({ ...r.words, progress: r.user_progress || undefined }));
  }

  async getStarredWords(): Promise<WordWithProgress[]> {
    const results = await db.select().from(words)
      .leftJoin(userProgress, eq(words.id, userProgress.wordId))
      .where(eq(userProgress.isStarred, true));
    return results.map(r => ({ ...r.words, progress: r.user_progress || undefined }));
  }

  async toggleWordStar(wordId: string): Promise<void> {
    // This requires fetching first, then updating, which can be prone to race conditions.
    // A raw SQL query or a more advanced ORM feature might be better here.
    const current = await db.select({ isStarred: userProgress.isStarred }).from(userProgress).where(eq(userProgress.wordId, wordId));
    const isStarred = current[0]?.isStarred || false;
    await db.insert(userProgress).values({ wordId, isStarred: !isStarred }).onConflictDoUpdate({ target: userProgress.wordId, set: { isStarred: !isStarred } });
  }

  async addToVocabularyBook(wordId: string): Promise<void> {
    await db.insert(userProgress).values({ wordId, isInVocabularyBook: true }).onConflictDoUpdate({ target: userProgress.wordId, set: { isInVocabularyBook: true } });
  }
}
