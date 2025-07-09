# Barbershop Management System

## Overview

This is a comprehensive barbershop management platform built with React, Express.js, and PostgreSQL. The system provides appointment scheduling, customer management, queue management, point-of-sale functionality, and business analytics. It's designed as a white-label solution similar to GreatClips' technology stack.

## User Preferences

Preferred communication style: Simple, everyday language.
Theme visibility: Theme colors should be highly visible throughout the interface, with primary colors for barbershop names and important buttons with rounded backgrounds, and secondary colors for supporting text.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with JSON responses

### Key Components

#### Database Schema
The system uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: Barbershop owners/operators with profile information
- **Customers**: Client database with contact details and preferences
- **Services**: Barbershop services with pricing and duration
- **Appointments**: Scheduled appointments with customer and service linkage
- **Queue**: Walk-in customer queue management
- **Reviews**: Customer feedback and ratings
- **Gallery**: Portfolio images of work
- **Transactions**: Point-of-sale transaction records
- **Sessions**: Authentication session storage

#### Authentication System
- Uses Replit's OpenID Connect for secure authentication
- Session-based authentication with PostgreSQL session storage
- User profile management with barbershop-specific data
- Protected routes with authentication middleware

#### Core Features
1. **Dashboard**: Real-time business metrics and today's overview
2. **Appointment Management**: Full CRUD operations for scheduling
3. **Customer Management**: Customer profiles with history tracking
4. **Queue Management**: Real-time walk-in queue with status updates
5. **Point-of-Sale**: Transaction processing with service selection
6. **Gallery Management**: Image portfolio management
7. **Analytics**: Business insights and performance metrics
8. **Settings**: Business profile and service configuration

## Data Flow

### Client-Server Communication
- Frontend uses TanStack Query for efficient data fetching and caching
- API requests include authentication cookies for session management
- Real-time updates for queue management with 5-second polling intervals
- Optimistic updates for better user experience

### Database Operations
- Drizzle ORM provides type-safe database operations
- Connection pooling with Neon serverless PostgreSQL
- Prepared statements for performance and security
- Foreign key relationships maintain data integrity

### Authentication Flow
1. User accesses protected route
2. Authentication middleware checks session
3. Valid sessions allow access, invalid sessions redirect to login
4. Replit OpenID Connect handles authentication process
5. Successful authentication creates session and user profile

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database toolkit
- **Connection Pooling**: Efficient database connection management

### Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Node.js
- **Session Storage**: PostgreSQL-based session management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server with middleware for development
- Environment variables for database connection
- Replit development banner integration

### Production Build
- Vite builds optimized client bundle
- esbuild bundles server code for Node.js
- Static assets served from dist/public
- Express serves API routes and static files

### Environment Configuration
- Database URL configured via environment variables
- Session secrets for security
- Replit domain configuration for authentication
- Production/development environment detection

### Scalability Considerations
- Serverless PostgreSQL for automatic scaling
- Stateless authentication with session storage
- Client-side caching reduces server load
- Optimized bundle sizes for faster loading

## Recent Changes

### January 2025
- **Enhanced Theme Visibility**: Made theme colors highly visible throughout the interface
  - Barbershop names display in primary color in navigation and dashboard
  - Action buttons use primary color backgrounds with rounded corners
  - Dashboard stats cards use primary/secondary color icons and backgrounds
  - Queue management components styled with theme colors
  - Card titles throughout the app use primary/secondary colors
- **Navigation Improvements**: Fixed nested anchor tag warnings and improved branding display
- **White-label Branding**: Barbershop name displayed instead of "Trimify" throughout the interface
- **Comprehensive Settings Page**: Built full-featured settings with 4 main sections:
  - Profile tab for business information (name, address, phone, booking style)
  - Appearance tab with real-time color picker and live preview functionality
  - Business Hours tab with toggle switches for each day of the week
  - Notifications tab for email/SMS preferences
  - API endpoint for updating user profile with proper validation
  - Real-time theme updates that instantly reflect throughout the interface