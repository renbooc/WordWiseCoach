import { type Word, type UserProgress, type StudySession, type PracticeResult, type StudyPlan, type InsertWord, type InsertUserProgress, type InsertStudySession, type InsertPracticeResult, type InsertStudyPlan, type WordWithProgress, type DashboardStats } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
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

export class MemStorage implements IStorage {
  private words: Map<string, Word> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private studySessions: Map<string, StudySession> = new Map();
  private practiceResults: Map<string, PracticeResult> = new Map();
  private studyPlans: Map<string, StudyPlan> = new Map();

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData(): void {
    // Initialize with common English words for middle/high school
    const sampleWords: InsertWord[] = [
      {
        word: "beautiful",
        phonetic: "/ˈbjuːtɪfʊl/",
        partOfSpeech: "adj.",
        chineseDefinition: "美丽的，漂亮的",
        englishExample: "She has a beautiful smile.",
        chineseExample: "她有一个美丽的笑容。",
        difficulty: 2,
        category: "junior",
        frequency: 8
      },
      {
        word: "excellent",
        phonetic: "/ˈeksələnt/",
        partOfSpeech: "adj.",
        chineseDefinition: "杰出的，优秀的",
        englishExample: "Your work is excellent!",
        chineseExample: "你的工作很出色！",
        difficulty: 3,
        category: "junior",
        frequency: 7
      },
      {
        word: "wonderful",
        phonetic: "/ˈwʌndərfʊl/",
        partOfSpeech: "adj.",
        chineseDefinition: "精彩的，绝妙的",
        englishExample: "We had a wonderful time at the party.",
        chineseExample: "我们在聚会上玩得很开心。",
        difficulty: 2,
        category: "junior",
        frequency: 6
      },
      {
        word: "amazing",
        phonetic: "/əˈmeɪzɪŋ/",
        partOfSpeech: "adj.",
        chineseDefinition: "令人惊异的，了不起的",
        englishExample: "The view from the mountain is amazing.",
        chineseExample: "山上的景色令人惊叹。",
        difficulty: 3,
        category: "junior",
        frequency: 8
      },
      {
        word: "important",
        phonetic: "/ɪmˈpɔːrtənt/",
        partOfSpeech: "adj.",
        chineseDefinition: "重要的",
        englishExample: "Education is very important for your future.",
        chineseExample: "教育对你的未来非常重要。",
        difficulty: 2,
        category: "junior",
        frequency: 9
      },
      {
        word: "knowledge",
        phonetic: "/ˈnɒlɪdʒ/",
        partOfSpeech: "n.",
        chineseDefinition: "知识，学问",
        englishExample: "Reading books can increase your knowledge.",
        chineseExample: "读书可以增加你的知识。",
        difficulty: 4,
        category: "senior",
        frequency: 7
      },
      {
        word: "environment",
        phonetic: "/ɪnˈvaɪrənmənt/",
        partOfSpeech: "n.",
        chineseDefinition: "环境",
        englishExample: "We must protect our environment.",
        chineseExample: "我们必须保护我们的环境。",
        difficulty: 4,
        category: "senior",
        frequency: 8
      },
      {
        word: "experience",
        phonetic: "/ɪkˈspɪriəns/",
        partOfSpeech: "n.",
        chineseDefinition: "经验，体验",
        englishExample: "She has a lot of work experience.",
        chineseExample: "她有很多工作经验。",
        difficulty: 3,
        category: "senior",
        frequency: 9
      },
      {
        word: "opportunity",
        phonetic: "/ˌɒpəˈtuːnəti/",
        partOfSpeech: "n.",
        chineseDefinition: "机会，时机",
        englishExample: "This is a great opportunity to learn.",
        chineseExample: "这是一个很好的学习机会。",
        difficulty: 4,
        category: "senior",
        frequency: 8
      },
      {
        word: "success",
        phonetic: "/səkˈses/",
        partOfSpeech: "n.",
        chineseDefinition: "成功",
        englishExample: "Hard work is the key to success.",
        chineseExample: "努力工作是成功的关键。",
        difficulty: 3,
        category: "junior",
        frequency: 8
      }
    ];

    // Add sample words
    sampleWords.forEach(word => {
      const id = randomUUID();
      this.words.set(id, { 
        ...word, 
        id,
        difficulty: word.difficulty || 1,
        category: word.category || "general", 
        frequency: word.frequency || 1
      });
      
      // Add some sample progress
      this.userProgress.set(id, {
        id: randomUUID(),
        wordId: id,
        masteryLevel: Math.floor(Math.random() * 100),
        timesStudied: Math.floor(Math.random() * 10) + 1,
        timesCorrect: Math.floor(Math.random() * 8),
        lastStudied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        nextReview: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        isStarred: Math.random() > 0.7,
        isInVocabularyBook: Math.random() > 0.6,
      });
    });
  }

  async getAllWords(): Promise<Word[]> {
    return Array.from(this.words.values());
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    return Array.from(this.words.values()).filter(word => word.category === category);
  }

  async getWord(id: string): Promise<Word | undefined> {
    return this.words.get(id);
  }

  async searchWords(query: string): Promise<Word[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.words.values()).filter(word => 
      word.word.toLowerCase().includes(searchTerm) ||
      word.chineseDefinition.toLowerCase().includes(searchTerm)
    );
  }

  async createWord(insertWord: InsertWord): Promise<Word> {
    const id = randomUUID();
    const word: Word = { 
      ...insertWord, 
      id,
      difficulty: insertWord.difficulty || 1,
      category: insertWord.category || "general", 
      frequency: insertWord.frequency || 1
    };
    this.words.set(id, word);
    return word;
  }

  async getUserProgress(wordId: string): Promise<UserProgress | undefined> {
    return this.userProgress.get(wordId);
  }

  async updateUserProgress(wordId: string, progressUpdates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const existing = this.userProgress.get(wordId);
    const updated: UserProgress = {
      id: existing?.id || randomUUID(),
      wordId,
      masteryLevel: existing?.masteryLevel || 0,
      timesStudied: existing?.timesStudied || 0,
      timesCorrect: existing?.timesCorrect || 0,
      lastStudied: existing?.lastStudied || null,
      nextReview: existing?.nextReview || null,
      isStarred: existing?.isStarred || false,
      isInVocabularyBook: existing?.isInVocabularyBook || false,
      ...progressUpdates,
    };
    this.userProgress.set(wordId, updated);
    return updated;
  }

  async getWordsForReview(): Promise<WordWithProgress[]> {
    const now = new Date();
    const results: WordWithProgress[] = [];
    
    for (const [wordId, progress] of Array.from(this.userProgress.entries())) {
      if (progress.nextReview && progress.nextReview <= now) {
        const word = this.words.get(wordId);
        if (word) {
          results.push({ ...word, progress });
        }
      }
    }
    
    return results.slice(0, 50); // Limit to 50 words for review
  }

  async getWordsByMasteryLevel(minLevel: number, maxLevel: number): Promise<WordWithProgress[]> {
    const results: WordWithProgress[] = [];
    
    for (const [wordId, progress] of Array.from(this.userProgress.entries())) {
      if (progress.masteryLevel >= minLevel && progress.masteryLevel <= maxLevel) {
        const word = this.words.get(wordId);
        if (word) {
          results.push({ ...word, progress });
        }
      }
    }
    
    return results;
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = randomUUID();
    const session: StudySession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      wordsLearned: insertSession.wordsLearned || 0,
      timeSpent: insertSession.timeSpent || 0,
      accuracy: insertSession.accuracy || 0,
    };
    this.studySessions.set(id, session);
    return session;
  }

  async getRecentStudySessions(limit: number): Promise<StudySession[]> {
    return Array.from(this.studySessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async savePracticeResult(insertResult: InsertPracticeResult): Promise<PracticeResult> {
    const id = randomUUID();
    const result: PracticeResult = { 
      ...insertResult, 
      id,
      timeSpent: insertResult.timeSpent || 0,
      userAnswer: insertResult.userAnswer || null
    };
    this.practiceResults.set(id, result);
    return result;
  }

  async getPracticeHistory(wordId: string): Promise<PracticeResult[]> {
    return Array.from(this.practiceResults.values()).filter(result => result.wordId === wordId);
  }

  async createStudyPlan(insertPlan: InsertStudyPlan): Promise<StudyPlan> {
    const id = randomUUID();
    const plan: StudyPlan = {
      ...insertPlan,
      id,
      createdAt: new Date(),
      dailyWordCount: insertPlan.dailyWordCount || 20,
      studyDuration: insertPlan.studyDuration || 30,
      reviewStrategy: insertPlan.reviewStrategy || "spaced",
      studyFocus: insertPlan.studyFocus || ["vocabulary", "spelling", "context"],
      weeklySchedule: insertPlan.weeklySchedule || [true, true, true, true, true, true, false],
      isActive: insertPlan.isActive || false,
    };
    this.studyPlans.set(id, plan);
    return plan;
  }

  async getActiveStudyPlan(): Promise<StudyPlan | undefined> {
    return Array.from(this.studyPlans.values()).find(plan => plan.isActive);
  }

  async updateStudyPlan(id: string, updates: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const existing = this.studyPlans.get(id);
    if (!existing) {
      throw new Error("Study plan not found");
    }
    const updated = { ...existing, ...updates };
    this.studyPlans.set(id, updated);
    return updated;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const sessions = Array.from(this.studySessions.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => s.createdAt >= today);
    const recentSessions = sessions
      .filter(s => s.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate streak
    let streakDays = 0;
    const dates = recentSessions.map(s => {
      const date = new Date(s.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = today.getTime() - (i * 24 * 60 * 60 * 1000);
      if (uniqueDates[i] === expectedDate) {
        streakDays++;
      } else {
        break;
      }
    }

    const todayStudyTime = todaySessions.reduce((sum, s) => sum + s.timeSpent, 0);
    const totalWordsLearned = Array.from(this.userProgress.values()).filter(p => p.masteryLevel > 50).length;
    const avgMastery = Array.from(this.userProgress.values()).reduce((sum, p) => sum + p.masteryLevel, 0) / this.userProgress.size;

    // Calculate review reminders
    const now = new Date();
    const reviewWords = Array.from(this.userProgress.values()).filter(p => p.nextReview && p.nextReview <= now);
    const urgent = reviewWords.filter(p => p.masteryLevel < 30).length;
    const regular = reviewWords.filter(p => p.masteryLevel >= 30 && p.masteryLevel < 70).length;
    const consolidation = reviewWords.filter(p => p.masteryLevel >= 70).length;

    return {
      streakDays,
      totalWordsLearned,
      masteryRate: Math.round(avgMastery),
      todayStudyTime,
      todayProgress: {
        newWords: { current: todaySessions.filter(s => s.sessionType === 'study').reduce((sum, s) => sum + s.wordsLearned, 0), target: 10 },
        review: { current: todaySessions.filter(s => s.sessionType === 'review').reduce((sum, s) => sum + s.wordsLearned, 0), target: 15 },
        listening: { current: todaySessions.filter(s => s.sessionType === 'practice').reduce((sum, s) => sum + s.wordsLearned, 0), target: 8 },
      },
      reviewReminders: { urgent, regular, consolidation }
    };
  }

  async getVocabularyBook(): Promise<WordWithProgress[]> {
    const results: WordWithProgress[] = [];
    
    for (const [wordId, progress] of Array.from(this.userProgress.entries())) {
      if (progress.isInVocabularyBook) {
        const word = this.words.get(wordId);
        if (word) {
          results.push({ ...word, progress });
        }
      }
    }
    
    return results;
  }

  async getStarredWords(): Promise<WordWithProgress[]> {
    const results: WordWithProgress[] = [];
    
    for (const [wordId, progress] of Array.from(this.userProgress.entries())) {
      if (progress.isStarred) {
        const word = this.words.get(wordId);
        if (word) {
          results.push({ ...word, progress });
        }
      }
    }
    
    return results;
  }

  async toggleWordStar(wordId: string): Promise<void> {
    const progress = this.userProgress.get(wordId);
    if (progress) {
      progress.isStarred = !progress.isStarred;
      this.userProgress.set(wordId, progress);
    }
  }

  async addToVocabularyBook(wordId: string): Promise<void> {
    const progress = this.userProgress.get(wordId);
    if (progress) {
      progress.isInVocabularyBook = true;
      this.userProgress.set(wordId, progress);
    }
  }
}

export const storage = new MemStorage();
