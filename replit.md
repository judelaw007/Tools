# MojiTax Demo Tools Platform

## Overview
MojiTax Demo Tools is a Next.js-based platform that provides practical demo tools for learning international tax concepts. This is a course-companion application designed to make complex tax principles accessible through interactive demonstrations.

## Technology Stack
- **Frontend Framework**: Next.js 14.2.0 with App Router
- **UI Styling**: Tailwind CSS with custom MojiTax branding
- **Authentication & Database**: Supabase
- **Package Manager**: npm
- **Language**: TypeScript
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation

## Project Structure
```
app/
├── (admin)/          # Admin-protected routes
├── (auth)/           # Authentication routes
├── (public)/         # Public-facing routes
└── layout.tsx        # Root layout

lib/
├── supabase/
│   ├── client.ts     # Client-side Supabase client
│   └── server.ts     # Server-side Supabase client
└── ...               # Additional utilities

components/           # Reusable React components
```

## Development

### Running Locally
The application runs on port 5000 to work with Replit's proxy:
```bash
npm run dev
```

The dev server is configured to:
- Bind to 0.0.0.0:5000 for Replit compatibility
- Use webpack polling for file watching in cloud environments
- Enable Next.js server actions (2mb body limit)

### Database
This project uses an external Supabase instance for:
- User authentication
- Data storage
- Real-time subscriptions (if applicable)

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations
- `npm run db:studio` - Open Drizzle Studio

## Deployment
Configured for Replit Autoscale deployment:
- **Build command**: `npm run build`
- **Start command**: `npm start`
- **Deployment type**: Autoscale (stateless web application)

## Architecture Decisions
- **App Router**: Using Next.js 14 App Router for improved performance and developer experience
- **Route Groups**: Organized by access level (admin, auth, public) for clear separation of concerns
- **Supabase**: Leverages server-side and client-side implementations for optimal data fetching
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first styling with custom MojiTax design system

## Environment Configuration
All environment variables are managed through Replit Secrets for security. The application expects:
- Supabase credentials (public URL and anonymous key)
- Any additional API keys for third-party integrations

## Recent Changes
- **2024-12-06**: Initial project import to Replit
  - Configured Next.js for Replit proxy compatibility
  - Set up Supabase environment variables
  - Configured development workflow and deployment settings

## User Preferences
None documented yet. This section will be updated as preferences are established during development.
