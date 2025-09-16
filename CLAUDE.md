# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordWiseCoach is a full-stack vocabulary learning application built with React, Express, and PostgreSQL. The app helps users learn English vocabulary through interactive exercises, spaced repetition algorithms, and personalized study plans.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Runs both frontend (Vite) and backend (Express) concurrently with hot reloading.

### Build
```bash
npm run build
```
Builds the frontend for production.

### Type Checking
```bash
npm run check
```
Runs TypeScript type checking across the project.

### Database Operations
```bash
npm run db:push
```
Pushes database schema changes using Drizzle Kit.

## Architecture Overview

### Project Structure
- `api/` - Express.js backend with TypeScript
- `client/` - React frontend built with Vite
- `shared/` - Shared types and database schema (Drizzle ORM)

### Backend Architecture
- **Entry Point**: `api/index.ts` - Express server with session management
- **Database**: PostgreSQL via Neon Database with Drizzle ORM
- **Schema**: `shared/schema.ts` - Contains all database tables and Zod validation schemas
- **Storage Layer**: `api/drizzle-storage.ts` - Database operations with fallback to in-memory storage
- **Authentication**: Passport.js with local strategy and PostgreSQL session store
- **API Routes**: RESTful endpoints in `api/routes.ts`

### Frontend Architecture
- **Entry Point**: `client/src/main.tsx`
- **Router**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: TailwindCSS with custom themes
- **Path Aliases**: `@/` points to `client/src/`, `@shared` to `shared/`

### Key Database Tables
- `users` - User accounts with email/password authentication
- `words` - Vocabulary entries with phonetics, definitions, examples
- `user_progress` - Individual learning progress with SM-2 spaced repetition
- `study_sessions` - Learning session tracking
- `practice_results` - Exercise attempt results
- `study_plans` - Personalized learning schedules

### Authentication Flow
- Session-based authentication using express-session with PostgreSQL store
- Passport.js local strategy for login/signup
- Protected routes wrapped with `ProtectedRoute` component
- Auth state managed via `AuthProvider` context

### Development Environment
- Vite proxy configuration routes `/api/*` to `http://localhost:3001` in development
- Frontend runs on Vite dev server, backend on Express (port 3001)
- Environment variables in `.env` file (DATABASE_URL, SESSION_SECRET)

### Spaced Repetition System
The app implements the SM-2 algorithm for optimal learning:
- `interval` - Days until next review
- `easeFactor` - Learning difficulty adjustment (2.5 default)
- `repetitions` - Number of successful reviews
- `masteryLevel` - User's proficiency with each word (0-5)

### Learning Features
- Multiple exercise types: multiple choice, fill-in-blanks, translation, spelling
- Progress tracking with mastery levels and study streaks
- Vocabulary management with starring and collections
- Dashboard with daily goals and statistics
- Study plans with customizable schedules

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Passport.js
- **Database**: PostgreSQL (Neon), Drizzle ORM, Drizzle Kit
- **UI**: shadcn/ui, Radix UI, TailwindCSS, Lucide React
- **Validation**: Zod schemas for runtime validation
- **Development**: Concurrently for parallel dev servers

### API Conventions
- RESTful endpoints under `/api/` prefix
- Authentication middleware `isAuthenticated` protects routes
- Zod schemas validate request bodies
- Error responses include descriptive messages
- File uploads handled via multer with 5MB limit

### Common Tasks
- Add new vocabulary: Use `insertWordSchema` validation
- Track user progress: Update `user_progress` table with SM-2 calculations
- Create study sessions: Insert into `study_sessions` and `practice_results`
- Authentication: All protected routes require valid session