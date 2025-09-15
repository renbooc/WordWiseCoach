import { db } from "./db.js";
import { users, words, userProgress, studySessions, practiceResults, studyPlans } from "../shared/schema.js";
import type { User, Word, UserProgress, StudySession, PracticeResult, StudyPlan, InsertUser, InsertWord, InsertUserProgress, InsertStudySession, InsertPracticeResult, InsertStudyPlan, WordWithProgress, DashboardStats } from "../shared/schema.js";
import type { IStorage } from "./storage.js";
import { eq, and, lte, gte, desc, sql, countDistinct, sum } from "drizzle-orm";

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
    const alreadyStudiedWordIds = db.select({ wordId: userProgress.wordId }).from(userProgress).where(eq(userProgress.userId, userId));

    const newWords = await db.select().from(words)
      .where(and(
        eq(words.category, category),
        sql`${words.id} NOT IN ${alreadyStudiedWordIds}`
      ))
      .limit(limit);

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
    console.log(`Fetching real dashboard stats for user: ${userId}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total words learned
    const totalWordsResult = await db.select({ count: countDistinct(userProgress.wordId) })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const totalWordsLearned = totalWordsResult[0]?.count || 0;

    // 2. Today's study time
    const todayTimeResult = await db.select({ total: sum(studySessions.timeSpent) })
      .from(studySessions)
      .where(and(eq(studySessions.userId, userId), gte(studySessions.createdAt, today)));
    const todayStudyTime = Math.round((Number(todayTimeResult[0]?.total) || 0) / 60);

    // 3. Mastery Rate
    const progressStats = await db.select({
        totalStudied: sum(userProgress.timesStudied),
        totalCorrect: sum(userProgress.timesCorrect)
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    const totalStudied = Number(progressStats[0]?.totalStudied) || 0;
    const totalCorrect = Number(progressStats[0]?.totalCorrect) || 0;
    const masteryRate = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

    // 4. Streak Days (a more complex query)
    const sessionDatesResult = await db.selectDistinct({ date: sql<string>`DATE(${studySessions.createdAt})` })
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(sql<string>`DATE(${studySessions.createdAt})`));

    let streakDays = 0;
    if (sessionDatesResult.length > 0) {
        let currentDate = new Date();
        let lastDate = new Date(sessionDatesResult[0].date);
        
        // Check if today or yesterday is the last study day
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

    // For todayProgress and reviewReminders, we will return mock data for now
    // as their calculation is also complex.
    return {
      streakDays,
      totalWordsLearned,
      masteryRate,
      todayStudyTime,
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
    const existing = await this.getUserProgress(userId, wordId);
    const isStarred = existing?.isStarred || false;
    await this.updateUserProgress(userId, wordId, { isStarred: !isStarred });
  }

  async addToVocabularyBook(userId: string, wordId: string): Promise<void> {
    await this.updateUserProgress(userId, wordId, { isInVocabularyBook: true });
  }
}