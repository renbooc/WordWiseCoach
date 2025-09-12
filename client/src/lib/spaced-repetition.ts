/**
 * Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo SM-2 algorithm with modifications for vocabulary learning
 */

export interface ReviewSchedule {
  nextReviewDate: Date;
  interval: number; // days until next review
  easeFactor: number; // multiplier for interval calculation
  repetitions: number; // number of successful reviews
}

export interface ReviewResult {
  quality: number; // 0-5 scale (0 = complete blackout, 5 = perfect response)
  responseTime?: number; // milliseconds taken to respond
  isCorrect: boolean;
}

export class SpacedRepetitionScheduler {
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  private static readonly INITIAL_INTERVAL = 1;

  /**
   * Calculate the next review schedule based on performance
   */
  static calculateNextReview(
    currentSchedule: ReviewSchedule | null,
    reviewResult: ReviewResult
  ): ReviewSchedule {
    const { quality, isCorrect } = reviewResult;
    
    // Initialize for new words
    if (!currentSchedule) {
      return {
        nextReviewDate: this.addDays(new Date(), this.INITIAL_INTERVAL),
        interval: this.INITIAL_INTERVAL,
        easeFactor: this.INITIAL_EASE_FACTOR,
        repetitions: isCorrect ? 1 : 0,
      };
    }

    let { interval, easeFactor, repetitions } = currentSchedule;

    if (quality < 3 || !isCorrect) {
      // Failed review - reset repetitions and use short interval
      repetitions = 0;
      interval = 1;
    } else {
      // Successful review
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      // Adjust ease factor based on quality
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.max(easeFactor, this.MIN_EASE_FACTOR);
    }

    return {
      nextReviewDate: this.addDays(new Date(), interval),
      interval,
      easeFactor,
      repetitions,
    };
  }

  /**
   * Convert mastery level and performance to review quality (0-5)
   */
  static calculateQuality(masteryLevel: number, isCorrect: boolean, responseTime?: number): number {
    if (!isCorrect) {
      return masteryLevel < 20 ? 0 : masteryLevel < 50 ? 1 : 2;
    }

    // Base quality on mastery level
    let quality = Math.floor(masteryLevel / 20) + 1; // 1-5 based on mastery

    // Adjust for response time if provided (faster = higher quality)
    if (responseTime) {
      if (responseTime < 3000) quality = Math.min(5, quality + 1); // Very fast
      else if (responseTime > 10000) quality = Math.max(1, quality - 1); // Very slow
    }

    return Math.max(0, Math.min(5, quality));
  }

  /**
   * Determine if a word needs review based on current date
   */
  static needsReview(schedule: ReviewSchedule | null): boolean {
    if (!schedule) return true;
    return new Date() >= schedule.nextReviewDate;
  }

  /**
   * Get priority score for review ordering (higher = more urgent)
   */
  static getReviewPriority(schedule: ReviewSchedule | null, masteryLevel: number): number {
    if (!schedule) return 100; // New words get highest priority

    const now = new Date();
    const daysOverdue = Math.max(0, 
      (now.getTime() - schedule.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Priority factors:
    // 1. Overdue time (more overdue = higher priority)
    // 2. Low mastery level (less mastered = higher priority)
    // 3. Repetition count (fewer repetitions = higher priority)

    let priority = 0;

    // Overdue factor (0-50 points)
    priority += Math.min(50, daysOverdue * 10);

    // Mastery factor (0-30 points, inverse of mastery level)
    priority += (100 - masteryLevel) * 0.3;

    // Repetition factor (0-20 points)
    priority += Math.max(0, 20 - schedule.repetitions * 2);

    return priority;
  }

  /**
   * Generate optimal review sessions based on available time and priorities
   */
  static generateReviewSession(
    wordsToReview: Array<{
      id: string;
      schedule: ReviewSchedule | null;
      masteryLevel: number;
    }>,
    maxWords: number = 20
  ): string[] {
    // Calculate priorities and sort
    const prioritizedWords = wordsToReview
      .map(word => ({
        ...word,
        priority: this.getReviewPriority(word.schedule, word.masteryLevel),
      }))
      .sort((a, b) => b.priority - a.priority);

    // Select top priority words
    return prioritizedWords.slice(0, maxWords).map(word => word.id);
  }

  /**
   * Estimate study time based on word difficulty and mastery
   */
  static estimateStudyTime(masteryLevel: number, wordDifficulty: number): number {
    // Base time in seconds
    const baseTime = 30;
    
    // Adjust for mastery (less mastered = more time)
    const masteryMultiplier = (100 - masteryLevel) / 100 + 0.5;
    
    // Adjust for difficulty (1-5 scale)
    const difficultyMultiplier = wordDifficulty / 3;
    
    return Math.round(baseTime * masteryMultiplier * difficultyMultiplier);
  }

  /**
   * Track learning curve and suggest adjustments
   */
  static analyzeLearningPattern(
    recentResults: Array<{
      date: Date;
      isCorrect: boolean;
      masteryLevel: number;
    }>
  ): {
    trend: 'improving' | 'stable' | 'declining';
    recommendation: string;
  } {
    if (recentResults.length < 5) {
      return {
        trend: 'stable',
        recommendation: '继续学习以建立学习模式分析',
      };
    }

    // Calculate trend over recent sessions
    const recent = recentResults.slice(-5);
    const earlier = recentResults.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, r) => sum + r.masteryLevel, 0) / recent.length;
    const earlierAvg = earlier.length > 0 
      ? earlier.reduce((sum, r) => sum + r.masteryLevel, 0) / earlier.length
      : recentAvg;

    const improvement = recentAvg - earlierAvg;

    if (improvement > 5) {
      return {
        trend: 'improving',
        recommendation: '学习进展很好！可以考虑增加每日学习量',
      };
    } else if (improvement < -5) {
      return {
        trend: 'declining',
        recommendation: '建议减少学习量，增加复习频率',
      };
    } else {
      return {
        trend: 'stable',
        recommendation: '保持当前学习节奏',
      };
    }
  }

  /**
   * Helper function to add days to a date
   */
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

/**
 * Utility functions for working with spaced repetition
 */
export const spacedRepetitionUtils = {
  /**
   * Format next review time for display
   */
  formatNextReview(nextReview: Date): string {
    const now = new Date();
    const diffMs = nextReview.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '需要复习';
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays < 7) return `${diffDays}天后`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周后`;
    return `${Math.ceil(diffDays / 30)}个月后`;
  },

  /**
   * Get color for mastery level display
   */
  getMasteryColor(masteryLevel: number): string {
    if (masteryLevel < 30) return 'text-destructive';
    if (masteryLevel < 60) return 'text-chart-1';
    if (masteryLevel < 80) return 'text-chart-3';
    return 'text-chart-2';
  },

  /**
   * Calculate mastery level based on performance history
   */
  calculateMasteryLevel(
    timesStudied: number,
    timesCorrect: number,
    recentPerformance: number[] = []
  ): number {
    if (timesStudied === 0) return 0;

    // Base accuracy
    const accuracy = timesCorrect / timesStudied;
    
    // Recent performance weight (if available)
    const recentWeight = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, score) => sum + score, 0) / recentPerformance.length / 100
      : 0;

    // Combine historical and recent performance
    const weightedAccuracy = recentPerformance.length > 0
      ? (accuracy * 0.6 + recentWeight * 0.4)
      : accuracy;

    // Factor in consistency (more studies = higher potential mastery)
    const consistencyBonus = Math.min(20, timesStudied * 2);
    
    const masteryLevel = Math.round(weightedAccuracy * 80 + consistencyBonus);
    return Math.max(0, Math.min(100, masteryLevel));
  },
};
