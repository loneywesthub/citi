# Replit.md - Citigroup Banking Application

## Overview

This is a full-stack banking application built with React, Express, and TypeScript. The application simulates a Citigroup online banking interface with features for user authentication, account management, transaction history, and money transfers. The system uses a clean, modern architecture with separate client and server directories.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: tsx for TypeScript execution

### Directory Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utility functions and services
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express application
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Data access layer
│   └── vite.ts           # Development server setup
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema and validation
└── migrations/           # Database migration files
```

## Key Components

### Database Schema
The application uses four main tables:
- **Users**: Stores user authentication and profile information
- **Accounts**: Manages different account types (investment, savings) with balance tracking
- **Transactions**: Records all account transactions with running balances
- **Transfers**: Handles money transfers between accounts with fees and restrictions

### Authentication System
- Simple username/password authentication
- Session-based authentication (currently using in-memory storage for development)
- Protected routes and API endpoints

### Account Management
- Multiple account types (investment, savings)
- Balance visibility controls
- Account number masking for security
- Fixed-term investment accounts with early withdrawal penalties

### Transaction System
- Real-time transaction processing
- Transaction history with filtering
- Balance updates with each transaction
- Service charges and forfeited returns for early withdrawals

### Transfer System
- Inter-account transfers
- Validation for sufficient funds
- Early withdrawal penalties for fixed accounts
- Confirmation dialogs for restricted transfers

## Data Flow

1. **Authentication Flow**: User submits credentials → Server validates → Session created → User redirected to dashboard
2. **Account Data Flow**: Dashboard loads → Fetch user accounts → Display balances and account details
3. **Transaction Flow**: User initiates transfer → Validation checks → Confirmation modal → Process transfer → Update balances → Refresh UI
4. **Real-time Updates**: TanStack Query manages cache invalidation and background refetching

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Framework**: Radix UI components, Tailwind CSS, Lucide icons
- **State Management**: TanStack Query for server state
- **Validation**: Zod for schema validation
- **Utilities**: date-fns, clsx, class-variance-authority

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL adapter
- **Development**: tsx, Vite integration
- **Session Management**: connect-pg-simple for PostgreSQL sessions

### Database Provider
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: @neondatabase/serverless driver
- **Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Development Setup
- Client runs on Vite dev server with HMR
- Server runs with tsx for TypeScript execution
- Database migrations handled by Drizzle Kit
- Environment variables for database connection

### Production Build
- Client builds to static files via Vite
- Server bundles with esbuild for Node.js runtime
- Database schema pushed via Drizzle Kit
- Static files served from Express server

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Replit-specific development tools integration

## Changelog

Changelog:
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.