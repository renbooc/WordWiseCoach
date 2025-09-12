import type { Word, WordWithProgress, UserProgress } from "@shared/schema";

/**
 * Utility functions for word data manipulation and processing
 */

export interface WordStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  averageMastery: number;
}

export interface StudyMetrics {
  wordsPerDay: number;
  averageSessionTime: number;
  streakDays: number;
  weeklyProgress: number[];
}

export class WordDataProcessor {
  /**
   * Calculate comprehensive statistics for words
   */
  static calculateWordStats(words: WordWithProgress[]): WordStats {
    if (words.length === 0) {
      return {
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        averageMastery: 0,
      };
    }

    const totalWords = words.length;
    let masteredWords = 0;
    let learningWords = 0;
    let newWords = 0;
    let totalMastery = 0;

    words.forEach(word => {
      const masteryLevel = word.progress?.masteryLevel || 0;
      totalMastery += masteryLevel;

      if (masteryLevel >= 80) {
        masteredWords++;
      } else if (masteryLevel > 0) {
        learningWords++;
      } else {
        newWords++;
      }
    });

    return {
      totalWords,
      masteredWords,
      learningWords,
      newWords,
      averageMastery: Math.round(totalMastery / totalWords),
    };
  }

  /**
   * Group words by difficulty level
   */
  static groupWordsByDifficulty(words: Word[]): Record<number, Word[]> {
    return words.reduce((groups, word) => {
      const difficulty = word.difficulty;
      if (!groups[difficulty]) {
        groups[difficulty] = [];
      }
      groups[difficulty].push(word);
      return groups;
    }, {} as Record<number, Word[]>);
  }

  /**
   * Group words by category
   */
  static groupWordsByCategory(words: Word[]): Record<string, Word[]> {
    return words.reduce((groups, word) => {
      const category = word.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(word);
      return groups;
    }, {} as Record<string, Word[]>);
  }

  /**
   * Filter words that need review
   */
  static getWordsNeedingReview(words: WordWithProgress[]): WordWithProgress[] {
    const now = new Date();
    return words.filter(word => {
      if (!word.progress?.nextReview) return false;
      return new Date(word.progress.nextReview) <= now;
    });
  }

  /**
   * Get words for new learning session
   */
  static getWordsForNewLearning(
    words: WordWithProgress[], 
    count: number,
    category?: string
  ): WordWithProgress[] {
    let availableWords = words.filter(word => !word.progress || word.progress.masteryLevel === 0);
    
    if (category) {
      availableWords = availableWords.filter(word => word.category === category);
    }

    // Sort by frequency and difficulty for optimal learning order
    availableWords.sort((a, b) => {
      // Prioritize high frequency, low difficulty words
      const scoreA = a.frequency - a.difficulty;
      const scoreB = b.frequency - b.difficulty;
      return scoreB - scoreA;
    });

    return availableWords.slice(0, count);
  }

  /**
   * Generate practice questions from words
   */
  static generatePracticeQuestions(
    words: WordWithProgress[],
    questionType: 'multiple-choice' | 'fill-blank' | 'translation',
    count: number = 10
  ): Array<{
    word: WordWithProgress;
    question: string;
    options?: string[];
    correctAnswer: string;
    type: string;
  }> {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, count);
    
    return shuffledWords.map(word => {
      switch (questionType) {
        case 'multiple-choice':
          const otherWords = words
            .filter(w => w.id !== word.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          const options = [word.chineseDefinition, ...otherWords.map(w => w.chineseDefinition)]
            .sort(() => Math.random() - 0.5);

          return {
            word,
            question: `选择单词 "${word.word}" 的正确释义：`,
            options,
            correctAnswer: word.chineseDefinition,
            type: questionType,
          };

        case 'fill-blank':
          const sentence = word.englishExample.replace(
            new RegExp(word.word, 'gi'), 
            '____'
          );
          return {
            word,
            question: `填空：${sentence}`,
            correctAnswer: word.word,
            type: questionType,
          };

        case 'translation':
          return {
            word,
            question: `请翻译：${word.chineseDefinition}`,
            correctAnswer: word.word,
            type: questionType,
          };

        default:
          return {
            word,
            question: word.word,
            correctAnswer: word.chineseDefinition,
            type: questionType,
          };
      }
    });
  }

  /**
   * Calculate learning efficiency metrics
   */
  static calculateLearningEfficiency(
    studySessions: Array<{
      timeSpent: number;
      wordsLearned: number;
      accuracy: number;
      createdAt: Date;
    }>
  ): {
    wordsPerMinute: number;
    accuracyTrend: number;
    efficiency: number;
  } {
    if (studySessions.length === 0) {
      return { wordsPerMinute: 0, accuracyTrend: 0, efficiency: 0 };
    }

    const totalTime = studySessions.reduce((sum, session) => sum + session.timeSpent, 0);
    const totalWords = studySessions.reduce((sum, session) => sum + session.wordsLearned, 0);
    const averageAccuracy = studySessions.reduce((sum, session) => sum + session.accuracy, 0) / studySessions.length;

    const wordsPerMinute = totalWords / Math.max(1, totalTime);

    // Calculate accuracy trend (recent vs earlier sessions)
    const recentSessions = studySessions.slice(-5);
    const earlierSessions = studySessions.slice(0, -5);
    
    const recentAccuracy = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
      : averageAccuracy;
    
    const earlierAccuracy = earlierSessions.length > 0
      ? earlierSessions.reduce((sum, s) => sum + s.accuracy, 0) / earlierSessions.length
      : averageAccuracy;

    const accuracyTrend = recentAccuracy - earlierAccuracy;

    // Overall efficiency score (0-100)
    const efficiency = Math.round(
      (wordsPerMinute * 20 + averageAccuracy * 100 + Math.max(0, accuracyTrend) * 50) / 3
    );

    return {
      wordsPerMinute: Math.round(wordsPerMinute * 100) / 100,
      accuracyTrend: Math.round(accuracyTrend * 100) / 100,
      efficiency: Math.min(100, Math.max(0, efficiency)),
    };
  }

  /**
   * Suggest optimal study plan based on user performance
   */
  static suggestStudyPlan(
    userStats: WordStats,
    recentPerformance: number[],
    availableTime: number // minutes per day
  ): {
    dailyNewWords: number;
    dailyReviewWords: number;
    focusAreas: string[];
    estimatedCompletionWeeks: number;
  } {
    const avgPerformance = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, p) => sum + p, 0) / recentPerformance.length
      : 70;

    // Adjust targets based on performance
    let dailyNewWords = Math.max(5, Math.min(30, Math.floor(availableTime / 3)));
    let dailyReviewWords = Math.max(10, Math.min(50, Math.floor(availableTime / 2)));

    if (avgPerformance < 60) {
      // Struggling - reduce new words, increase review
      dailyNewWords = Math.max(3, Math.floor(dailyNewWords * 0.7));
      dailyReviewWords = Math.min(60, Math.floor(dailyReviewWords * 1.3));
    } else if (avgPerformance > 85) {
      // Excelling - can handle more new words
      dailyNewWords = Math.min(40, Math.floor(dailyNewWords * 1.3));
    }

    // Determine focus areas
    const focusAreas = [];
    if (userStats.averageMastery < 60) focusAreas.push('基础词汇巩固');
    if (avgPerformance < 70) focusAreas.push('复习强化');
    if (userStats.newWords > userStats.learningWords) focusAreas.push('新词学习');
    if (focusAreas.length === 0) focusAreas.push('综合提升');

    // Estimate completion time
    const remainingWords = userStats.newWords + userStats.learningWords;
    const estimatedCompletionWeeks = Math.ceil(remainingWords / (dailyNewWords * 7));

    return {
      dailyNewWords,
      dailyReviewWords,
      focusAreas,
      estimatedCompletionWeeks,
    };
  }

  /**
   * Search and filter words with advanced options
   */
  static searchWords(
    words: WordWithProgress[],
    query: string,
    filters: {
      category?: string;
      difficulty?: number[];
      masteryRange?: [number, number];
      partOfSpeech?: string;
      frequency?: number;
    } = {}
  ): WordWithProgress[] {
    let filtered = words;

    // Text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchTerm) ||
        word.chineseDefinition.toLowerCase().includes(searchTerm) ||
        word.phonetic.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(word => word.category === filters.category);
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter(word => filters.difficulty!.includes(word.difficulty));
    }

    // Mastery level filter
    if (filters.masteryRange) {
      const [min, max] = filters.masteryRange;
      filtered = filtered.filter(word => {
        const mastery = word.progress?.masteryLevel || 0;
        return mastery >= min && mastery <= max;
      });
    }

    // Part of speech filter
    if (filters.partOfSpeech) {
      filtered = filtered.filter(word => word.partOfSpeech === filters.partOfSpeech);
    }

    // Frequency filter
    if (filters.frequency) {
      filtered = filtered.filter(word => word.frequency >= filters.frequency!);
    }

    return filtered;
  }

  /**
   * Export words data for backup or sharing
   */
  static exportWordsData(words: WordWithProgress[]): string {
    const exportData = words.map(word => ({
      word: word.word,
      phonetic: word.phonetic,
      definition: word.chineseDefinition,
      partOfSpeech: word.partOfSpeech,
      example: word.englishExample,
      exampleTranslation: word.chineseExample,
      category: word.category,
      difficulty: word.difficulty,
      mastery: word.progress?.masteryLevel || 0,
      timesStudied: word.progress?.timesStudied || 0,
      timesCorrect: word.progress?.timesCorrect || 0,
    }));

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate study recommendations based on forgetting curve
   */
  static generateStudyRecommendations(words: WordWithProgress[]): {
    urgentReview: WordWithProgress[];
    scheduledReview: WordWithProgress[];
    reinforcement: WordWithProgress[];
    maintenance: WordWithProgress[];
  } {
    const now = new Date();
    
    const urgentReview = words.filter(word => {
      if (!word.progress?.nextReview) return false;
      const daysPast = (now.getTime() - new Date(word.progress.nextReview).getTime()) / (1000 * 60 * 60 * 24);
      return daysPast > 0 && (word.progress.masteryLevel || 0) < 50;
    });

    const scheduledReview = words.filter(word => {
      if (!word.progress?.nextReview) return false;
      const daysPast = (now.getTime() - new Date(word.progress.nextReview).getTime()) / (1000 * 60 * 60 * 24);
      return daysPast >= 0 && daysPast <= 1 && (word.progress.masteryLevel || 0) >= 50;
    });

    const reinforcement = words.filter(word => {
      const mastery = word.progress?.masteryLevel || 0;
      return mastery > 30 && mastery < 80;
    });

    const maintenance = words.filter(word => {
      const mastery = word.progress?.masteryLevel || 0;
      return mastery >= 80;
    });

    return {
      urgentReview: urgentReview.slice(0, 20),
      scheduledReview: scheduledReview.slice(0, 15),
      reinforcement: reinforcement.slice(0, 10),
      maintenance: maintenance.slice(0, 5),
    };
  }
}

/**
 * Predefined word lists for different learning levels
 */
export const wordLists = {
  highFrequency: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'
  ],
  
  juniorCore: [
    'beautiful', 'important', 'different', 'wonderful', 'excellent',
    'interesting', 'difficult', 'popular', 'special', 'successful'
  ],
  
  seniorCore: [
    'environment', 'experience', 'opportunity', 'knowledge', 'education',
    'development', 'government', 'technology', 'community', 'organization'
  ],
  
  examFocus: [
    'analyze', 'evaluate', 'demonstrate', 'illustrate', 'emphasize',
    'constitute', 'interpret', 'establish', 'framework', 'perspective'
  ]
};

/**
 * Common word patterns and roots for vocabulary building
 */
export const wordPatterns = {
  prefixes: {
    'un-': '不，非',
    're-': '重新，再',
    'pre-': '预先，前',
    'dis-': '不，分离',
    'mis-': '错误，坏',
    'over-': '过度，超过',
    'under-': '不足，在...下',
    'inter-': '之间，相互',
    'multi-': '多',
    'anti-': '反对，抗'
  },
  
  suffixes: {
    '-tion': '动作，状态',
    '-ness': '性质，状态',
    '-ment': '结果，手段',
    '-able': '能够，适合',
    '-ful': '充满，具有',
    '-less': '无，缺乏',
    '-ly': '以...方式',
    '-ing': '进行，动名词',
    '-ed': '过去，被动',
    '-er': '人，更加'
  },
  
  roots: {
    'spect': '看',
    'port': '带，运',
    'dict': '说',
    'scrib': '写',
    'graph': '写，画',
    'phon': '声音',
    'photo': '光',
    'bio': '生命',
    'geo': '地球',
    'chron': '时间'
  }
};
