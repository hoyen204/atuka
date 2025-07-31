# Project Structure

## Root Level
- **Configuration**: `next.config.ts`, `tsconfig.json`, `tailwind.config.js`, `components.json`
- **Database**: `prisma/schema.prisma` - Prisma schema with game-specific models
- **Docker**: `Dockerfile`, `docker-compose.yml` - Multi-stage production builds
- **Environment**: `.env`, `.env.local` - Database URLs and API keys

## Source Structure (`src/`)

### Application Layer (`src/app/`)
- **API Routes**: RESTful endpoints following Next.js App Router conventions
  - `api/thien-dao-ban-thuong/` - Reward collection endpoints
  - Authentication required for all API routes via NextAuth sessions
- **Pages**: Dashboard, login, event management, and game-specific features
- **Services**: `services/ApiService.ts` - Centralized HTTP client with retry logic
- **Styling**: `globals.css` - Global Tailwind styles

### Components (`src/components/`)
- **UI Components**: `ui/` - shadcn/ui components (buttons, dialogs, forms)
- **Feature Components**: 
  - `clan/` - Clan management interfaces
  - `thien-dao/` - Reward collection components
- **Utility Components**: Session wrappers, loading states, toast notifications

### Business Logic (`src/lib/`)
- **Authentication**: `auth.config.ts`, `auth.ts` - NextAuth configuration
- **Database**: `prisma.ts` - Prisma client singleton
- **Parsers**: Game-specific HTML parsers for reward extraction
- **Utilities**: API helpers, date utilities, password hashing
- **Services**: Database monitoring, proxy management

### Type Definitions (`src/types/`)
- **NextAuth**: `next-auth.d.ts` - Extended session types
- **Domain Types**: Clan, shop, and game-specific type definitions
- **Models**: `src/models/types.ts` - Shared business logic types

### Custom Hooks (`src/hooks/`)
- **Authentication**: `useAuth.ts` - Session management
- **UI State**: `useGlobalLoading.ts`, `useToast.ts`
- **Responsive**: `useResponsive.ts` - Breakpoint utilities

## Naming Conventions
- **Files**: kebab-case for pages, PascalCase for components
- **API Routes**: Vietnamese game terms in URLs (e.g., `thien-dao-ban-thuong`)
- **Database**: snake_case for column names, PascalCase for model names
- **Components**: PascalCase with descriptive names

## Architecture Patterns
- **API Layer**: Session-based authentication with Prisma ORM
- **Component Structure**: Feature-based organization with shared UI components
- **State Management**: Zustand for client state, server state via API routes
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Proxy Management**: Random proxy selection with retry logic for game requests