import { db } from "./db.js";
import { users, words, userProgress, studySessions, practiceResults, studyPlans } from "../shared/schema.js";
import type { User, Word, UserProgress, StudySession, PracticeResult, StudyPlan, InsertUser, InsertWord, InsertUserProgress, InsertStudySession, InsertPracticeResult, InsertStudyPlan, WordWithProgress, DashboardStats } from "../shared/schema.js";
import type { IStorage } from "./storage.js";
import { eq, and, lte, gte, desc, sql, count, countDistinct, sum, isNull, not, or, inArray } from "drizzle-orm";

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
    const existing = await this.getUserProgress(userId, wordId);
    if (existing) {
      const result = await db.update(userProgress).set(progress).where(eq(userProgress.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(userProgress).values({ userId, wordId, ...progress }).returning();
      return result[0];
    }
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

  async getNewWordsForPlan(userId: string, category: string, limit: number): Promise<Word[]> {
    const newWords = await db.select().from(words).where(eq(words.category, category)).limit(limit);
    return newWords;
  }
  
  // ===== STUDY SESSIONS =====
  async createStudySession(session: InsertStudySession & { userId: string }): Promise<StudySession> {
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
  private async deactivateAllPlans(userId: string) {
    await db.update(studyPlans).set({ isActive: false }).where(eq(studyPlans.userId, userId));
  }

  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    await this.deactivateAllPlans(plan.userId);
    const result = await db.insert(studyPlans).values({ ...plan, isActive: true }).returning();
    return result[0];
  }

  async getAllUserPlans(userId: string): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.userId, userId)).orderBy(desc(studyPlans.createdAt));
  }

  async getActiveStudyPlan(userId: string): Promise<StudyPlan | undefined> {
    const result = await db.select().from(studyPlans).where(and(eq(studyPlans.userId, userId), eq(studyPlans.isActive, true)));
    return result[0];
  }

  async updateStudyPlan(userId: string, id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const result = await db.update(studyPlans).set(updates).where(and(eq(studyPlans.userId, userId), eq(studyPlans.id, id))).returning();
    return result[0];
  }

  async deleteStudyPlan(userId: string, id: string): Promise<void> {
    await db.delete(studyPlans).where(and(eq(studyPlans.userId, userId), eq(studyPlans.id, id)));
  }

  async activateStudyPlan(userId: string, id: string): Promise<StudyPlan> {
    await this.deactivateAllPlans(userId);
    const result = await db.update(studyPlans).set({ isActive: true }).where(and(eq(studyPlans.userId, userId), eq(studyPlans.id, id))).returning();
    return result[0];
  }
  
  // ===== DASHBOARD =====
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const activePlan = await this.getActiveStudyPlan(userId);

    // Queries
    const totalWordsLearnedQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), gte(userProgress.timesStudied, 1)));
    const todayStudyTimeQuery = db.select({ total: sum(studySessions.timeSpent) }).from(studySessions).where(and(eq(studySessions.userId, userId), gte(studySessions.createdAt, today)));
    const masteryRateQuery = db.select({ totalStudied: sum(userProgress.timesStudied), totalCorrect: sum(userProgress.timesCorrect) }).from(userProgress).where(eq(userProgress.userId, userId));
    const todayNewWordsQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), gte(userProgress.lastStudied, today), eq(userProgress.timesStudied, 1)));
    const todayReviewedWordsQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), gte(userProgress.lastStudied, today), gte(userProgress.timesStudied, 2)));
    const urgentReviewQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), or(lte(userProgress.nextReview, today), isNull(userProgress.nextReview))));
    const regularReviewQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), gte(userProgress.nextReview, tomorrow), lte(userProgress.nextReview, sevenDaysFromNow)));
    const consolidationReviewQuery = db.select({ count: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), gte(userProgress.nextReview, sevenDaysFromNow)));
    const sessionDatesQuery = db.selectDistinct({ date: sql<string>`DATE(${studySessions.createdAt})` }).from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(sql<string>`DATE(${studySessions.createdAt})`));

    // Execute in parallel
    const [
      totalWordsResult,
      todayTimeResult,
      progressStats,
      todayNewWordsResult,
      todayReviewedWordsResult,
      urgentReviewResult,
      regularReviewResult,
      consolidationReviewResult,
      sessionDatesResult
    ] = await Promise.all([
      totalWordsLearnedQuery,
      todayStudyTimeQuery,
      masteryRateQuery,
      todayNewWordsQuery,
      todayReviewedWordsQuery,
      urgentReviewQuery,
      regularReviewQuery,
      consolidationReviewQuery,
      sessionDatesQuery
    ]);

    // Process results
    const totalWordsLearned = totalWordsResult[0]?.count || 0;
    const todayStudyTime = Math.round((Number(todayTimeResult[0]?.total) || 0) / 60);
    const totalStudied = Number(progressStats[0]?.totalStudied) || 0;
    const totalCorrect = Number(progressStats[0]?.totalCorrect) || 0;
    const masteryRate = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

    let streakDays = 0;
    if (sessionDatesResult.length > 0) {
        let currentDate = new Date();
        let lastDate = new Date(sessionDatesResult[0].date);
        if (Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24) <= 1) {
            streakDays = 1;
            for (let i = 1; i < sessionDatesResult.length; i++) {
                const prevDate = new Date(sessionDatesResult[i].date);
                const diffDays = (lastDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays === 1) {
                    streakDays++;
                    lastDate = prevDate;
                } else {
                    break;
                }
            }
        }
    }

    return {
      streakDays,
      totalWordsLearned,
      masteryRate,
      todayStudyTime,
      todayProgress: {
        newWords: { current: todayNewWordsResult[0]?.count || 0, target: activePlan?.dailyWordCount || 10 },
        review: { current: todayReviewedWordsResult[0]?.count || 0, target: 15 }, // Target for review is not in plan, using static value
        listening: { current: 0, target: 8 }, // Not implemented
      },
      reviewReminders: {
        urgent: urgentReviewResult[0]?.count || 0,
        regular: regularReviewResult[0]?.count || 0,
        consolidation: consolidationReviewResult[0]?.count || 0,
      }
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
    const existing = await this.getUserProgress(userId, wordId);
    const isStarred = existing?.isStarred || false;
    await this.updateUserProgress(userId, wordId, { isStarred: !isStarred });
  }

  async addToVocabularyBook(userId: string, wordId: string): Promise<void> {
    await this.updateUserProgress(userId, wordId, { isInVocabularyBook: true });
  }
}
