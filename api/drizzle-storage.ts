import { db } from "./db.js";
import { users, words, userProgress, studySessions, practiceResults, studyPlans } from "../shared/schema.js";
import type { User, Word, UserProgress, StudySession, PracticeResult, StudyPlan, InsertUser, InsertWord, InsertUserProgress, InsertStudySession, InsertPracticeResult, InsertStudyPlan, WordWithProgress, DashboardStats } from "../shared/schema.js";
import type { IStorage } from "./storage.js";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";

export class DrizzleStorage implements IStorage {

  // ===== USER MANAGEMENT =====
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

  // ===== WORD MANAGEMENT =====
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
  
  // ===== USER PROGRESS =====
  async getUserProgress(userId: string, wordId: string): Promise<UserProgress | undefined> {
    const result = await db.select().from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.wordId, wordId)));
    return result[0];
  }

  async updateUserProgress(userId: string, wordId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress> {
    const result = await db.insert(userProgress).values({ userId, wordId, ...progress }).onConflictDoUpdate({ target: [userProgress.userId, userProgress.wordId], set: progress }).returning();
    return result[0];
  }

  async getWordsForReview(userId: string): Promise<WordWithProgress[]> {
    const now = new Date();
    const results = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), lte(userProgress.nextReview, now)))
      .leftJoin(words, eq(userProgress.wordId, words.id));
    
    return results.map(r => ({ ...r.words!, progress: r.user_progress }));
  }

  async getWordsByMasteryLevel(userId: string, minLevel: number, maxLevel: number): Promise<WordWithProgress[]> {
    const results = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), gte(userProgress.masteryLevel, minLevel), lte(userProgress.masteryLevel, maxLevel)))
      .leftJoin(words, eq(userProgress.wordId, words.id));

    return results.map(r => ({ ...r.words!, progress: r.user_progress }));
  }
  
  // ===== STUDY SESSIONS =====
  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const result = await db.insert(studySessions).values(session).returning();
    return result[0];
  }

  async getRecentStudySessions(userId: string, limit: number): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.createdAt)).limit(limit);
  }
  
  // ===== PRACTICE RESULTS =====
  async savePracticeResult(result: InsertPracticeResult): Promise<PracticeResult> {
    const res = await db.insert(practiceResults).values(result).returning();
    return res[0];
  }

  async getPracticeHistory(userId: string, wordId: string): Promise<PracticeResult[]> {
    return await db.select().from(practiceResults).where(and(eq(practiceResults.userId, userId), eq(practiceResults.wordId, wordId))).orderBy(desc(practiceResults.id));
  }
  
  // ===== STUDY PLANS =====
  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const result = await db.insert(studyPlans).values(plan).returning();
    return result[0];
  }

  async getActiveStudyPlan(userId: string): Promise<StudyPlan | undefined> {
    const result = await db.select().from(studyPlans).where(and(eq(studyPlans.userId, userId), eq(studyPlans.isActive, true)));
    return result[0];
  }

  async updateStudyPlan(userId: string, id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const result = await db.update(studyPlans).set(updates).where(and(eq(studyPlans.userId, userId), eq(studyPlans.id, id))).returning();
    return result[0];
  }
  
  // ===== DASHBOARD =====
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // This is a complex query. For now, we will return mock data.
    console.log(`Fetching dashboard stats for user: ${userId}`);
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
  
  // ===== VOCABULARY MANAGEMENT =====
  async getVocabularyBook(userId: string): Promise<WordWithProgress[]> {
    const results = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.isInVocabularyBook, true)))
      .leftJoin(words, eq(userProgress.wordId, words.id));
    return results.map(r => ({ ...r.words!, progress: r.user_progress }));
  }

  async getStarredWords(userId: string): Promise<WordWithProgress[]> {
    const results = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.isStarred, true)))
      .leftJoin(words, eq(userProgress.wordId, words.id));
    return results.map(r => ({ ...r.words!, progress: r.user_progress }));
  }

  async toggleWordStar(userId: string, wordId: string): Promise<void> {
    const current = await db.select({ isStarred: userProgress.isStarred }).from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.wordId, wordId)));
    const isStarred = current[0]?.isStarred || false;
    await db.insert(userProgress).values({ userId, wordId, isStarred: !isStarred }).onConflictDoUpdate({ target: [userProgress.userId, userProgress.wordId], set: { isStarred: !isStarred } });
  }

  async addToVocabularyBook(userId: string, wordId: string): Promise<void> {
    await db.insert(userProgress).values({ userId, wordId, isInVocabularyBook: true }).onConflictDoUpdate({ target: [userProgress.userId, userProgress.wordId], set: { isInVocabularyBook: true } });
  }
}