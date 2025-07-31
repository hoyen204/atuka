# Technology Stack

## Framework & Runtime
- **Next.js 15.3.4** with App Router (standalone output mode)
- **React 19** with TypeScript 5
- **Node.js 18.17.0+** runtime
- **Bun** as package manager (lockfile present)

## Database & ORM
- **MySQL** database with **Prisma ORM**
- Connection pooling and query optimization
- Database schema includes Users, Accounts, Proxies, Clans, and game-specific models

## Authentication & Security
- **NextAuth.js** for session management
- **bcrypt** for password hashing
- **jsonwebtoken** for token handling
- **crypto-js** for additional encryption needs

## UI & Styling
- **Tailwind CSS 4** with PostCSS
- **Radix UI** components for accessible UI primitives
- **Lucide React** for icons
- **shadcn/ui** component system

## State Management & HTTP
- **Zustand** for client-side state management
- **Axios** for HTTP requests with proxy support
- **https-proxy-agent** for proxy rotation
- **ioredis** for Redis caching

## Development & Build Tools
- **TypeScript** with strict mode enabled
- **ESLint** with Next.js configuration
- **Docker** with multi-stage builds for production
- **Turbopack** for faster development builds

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
```

### Docker
```bash
npm run docker:build:optimized  # Build optimized Docker image
npm run docker:run:optimized    # Run optimized container
npm run docker:test             # Test container
```

## Configuration Notes
- TypeScript build errors are ignored in production (`ignoreBuildErrors: true`)
- ESLint errors are ignored during builds
- Standalone output mode for Docker deployment
- Remote image patterns allow any HTTPS hostname
- Path aliases: `@/*` maps to `./src/*`