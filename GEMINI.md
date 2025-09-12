# Project Overview

This is a full-stack TypeScript application called WordWiseCoach. It's a web-based flashcard application for learning new words, with a focus on spaced repetition and personalized study plans.

**Frontend:**
- **Framework:** React with Vite
- **Routing:** wouter
- **Styling:** Tailwind CSS with shadcn/ui and Radix UI components
- **Data Fetching:** TanStack Query
- **State Management:** TanStack React Query for server state management

**Backend:**
- **Framework:** Express.js
- **Database:** Neon (serverless Postgres) with Drizzle ORM
- **Authentication:** Passport.js

**Key Features:**
- Word bank with definitions, examples, and categories
- Spaced repetition-based study sessions (SM-2 algorithm)
- Practice exercises (multiple choice, fill-in-the-blank, translation, spelling, and listening)
- Customizable study plans
- User progress tracking and dashboard
- Vocabulary management (collections, starring, categories)
- Light/dark mode support

# Building and Running

**Development:**
To run the application in development mode (with hot reloading):
```bash
npm run dev
```

**Production:**
To build the application for production:
```bash
npm run build
```
To start the application in production mode:
```bash
npm run start
```

**Database:**
To push database schema changes:
```bash
npm run db:push
```

**Type Checking:**
To check for TypeScript errors:
```bash
npm run check
```

# Development Conventions

- **Code Style:** The project uses Prettier for code formatting (inferred from `.prettierrc`).
- **Testing:** There are no explicit testing frameworks configured in `package.json`.
- **Commits:** No specific commit message format is enforced.
- **API:** The API is defined in `server/routes.ts` and uses a `storage` object for database interactions.
- **Schema:** The database schema is defined in `shared/schema.ts` using Drizzle ORM and Zod for validation.
- **Client:** The client-side code is located in the `client/src` directory and uses Vite for bundling.