import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== TABLES =====

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const words = pgTable("words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull(),
  phonetic: text("phonetic").notNull(),
  partOfSpeech: text("part_of_speech").notNull(),
  chineseDefinition: text("chinese_definition").notNull(),
  englishExample: text("english_example").notNull(),
  chineseExample: text("chinese_example").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  category: text("category").notNull().default("general"),
  frequency: integer("frequency").notNull().default(1),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  wordId: varchar("word_id").notNull().references(() => words.id, { onDelete: 'cascade' }),
  masteryLevel: integer("mastery_level").notNull().default(0),
  timesStudied: integer("times_studied").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  lastStudied: timestamp("last_studied"),
  nextReview: timestamp("next_review"),
  isStarred: boolean("is_starred").notNull().default(false),
  isInVocabularyBook: boolean("is_in_vocabulary_book").notNull().default(false),
});

export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionType: text("session_type").notNull(),
  wordsLearned: integer("words_learned").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const practiceResults = pgTable("practice_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").notNull().references(() => studySessions.id, { onDelete: 'cascade' }),
  wordId: varchar("word_id").notNull().references(() => words.id, { onDelete: 'cascade' }),
  exerciseType: text("exercise_type").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer").notNull(),
  timeSpent: integer("time_spent").notNull().default(0),
});

export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  targetCategory: text("target_category").notNull(),
  dailyWordCount: integer("daily_word_count").notNull().default(20),
  studyDuration: integer("study_duration").notNull().default(30),
  reviewStrategy: text("review_strategy").notNull().default("spaced"),
  studyFocus: jsonb("study_focus").notNull().default('[]'),
  weeklySchedule: jsonb("weekly_schedule").notNull().default('[]'),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});


// ===== ZOD SCHEMAS FOR VALIDATION =====

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email({ message: "Invalid email address" }),
}).omit({ id: true, createdAt: true });

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export const insertWordSchema = createInsertSchema(words).omit({ id: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true });
export const insertStudySessionSchema = createInsertSchema(studySessions).omit({ id: true, createdAt: true });
export const insertPracticeResultSchema = createInsertSchema(practiceResults).omit({ id: true });
export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true });


// ===== TYPES FOR USE IN APPLICATION CODE =====

export type User = typeof users.$inferSelect;
export type Word = typeof words.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type PracticeResult = typeof practiceResults.$inferSelect;
export type StudyPlan = typeof studyPlans.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type InsertPracticeResult = z.infer<typeof insertPracticeResultSchema>;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;

// Helper types for API responses, not directly in DB
export type WordWithProgress = Word & {
  progress?: UserProgress;
};

export type DashboardStats = {
  streakDays: number;
  totalWordsLearned: number;
  masteryRate: number;
  todayStudyTime: number;
  todayProgress: {
    newWords: { current: number; target: number };
    review: { current: number; target: number };
    listening: { current: number; target: number };
  };
  reviewReminders: {
    urgent: number;
    regular: number;
    consolidation: number;
  };
};