# Vocabulary Learning Application

## Overview

This is a full-stack vocabulary learning application built with React, Express, and PostgreSQL. The application helps users learn English vocabulary through interactive exercises, spaced repetition algorithms, and personalized study plans. It features a modern UI built with shadcn/ui components and TailwindCSS, supporting both light and dark themes.

The application provides comprehensive vocabulary management, progress tracking, and multiple learning modes including study sessions, practice exercises, and review systems. It uses spaced repetition algorithms to optimize learning efficiency and retention.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom CSS variables for theming
- **Theme System**: Light/dark mode support with persistent theme storage

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for vocabulary management
- **Development Server**: Vite middleware integration for hot reloading
- **Error Handling**: Centralized error handling middleware
- **Logging**: Request/response logging with duration tracking

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Pattern**: Repository pattern with in-memory fallback storage for development

### Key Data Models
- **Words**: Core vocabulary entries with definitions, examples, and metadata
- **User Progress**: Individual word mastery levels and learning statistics
- **Study Sessions**: Learning session tracking with performance metrics
- **Practice Results**: Exercise attempt results for progress analysis
- **Study Plans**: Personalized learning schedules and goals

### Learning Features
- **Spaced Repetition**: SM-2 algorithm implementation for optimal review scheduling
- **Multiple Exercise Types**: Multiple choice, fill-in-blanks, translation, spelling, and listening exercises
- **Progress Tracking**: Mastery levels, study streaks, and performance analytics
- **Vocabulary Management**: Word collections, starring system, and category organization
- **Study Plans**: Customizable daily goals and learning schedules

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **react-hook-form**: Form state management and validation

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit integration features

### UI Components
- **shadcn/ui**: Pre-built accessible components using Radix UI
- **lucide-react**: Icon library
- **embla-carousel-react**: Carousel/slider functionality
- **cmdk**: Command palette and search interface

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class handling
- **nanoid**: Unique ID generation
- **zod**: Runtime type validation and schema definition