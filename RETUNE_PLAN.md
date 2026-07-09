# Repository Retune Plan — Namma Ride

## Overview
Comprehensive refactoring to improve code quality, optimize performance, modernize dependencies, and fix configuration issues across the monorepo.

---

## 1. Dependency Modernization

### Root Level (`package.json`)
- **Turbo**: `^1.13.0` → `^2.0.0` (latest stable)
  - Better incremental builds, improved caching, faster CI/CD
- **TypeScript**: `^5.3.3` → `^5.5.0` (latest)
  - Better performance, improved type checking
- **Prettier**: `^3.2.5` → `^3.3.0` (latest)

### Backend Stack (`apps/server/package.json`)
- **Hono**: `^4.0.9` → `^4.4.0` (latest)
  - Performance improvements, better middleware support
- **Firebase Admin**: `^14.1.0` → `^15.0.0` (latest)
  - Latest FCM improvements, better error handling
- **ioredis**: `^5.3.2` → `^5.4.0` (latest)
  - Connection pool improvements
- **Zod**: `^3.22.4` → `^3.24.0` (latest)
  - Better performance, enhanced error messages

### React Native/Expo Apps
- **Expo**: `~50.0.0` → `~52.0.0` (latest stable)
  - Better React 18 support, improved native module compatibility
- **Expo Router**: `~3.4.7` → `~4.0.0` (latest)
  - Enhanced protected routes, better type safety
- **React Native**: `0.73.6` → `0.74.0` (latest)
  - Performance improvements, better memory management
- **NativeWind**: `^4.0.36` → `^4.1.0` (latest)
  - Better Tailwind integration
- **TanStack Query**: `^5.101.2` → `^5.51.0` (latest)
  - Better caching strategies, improved devtools

### Admin Dashboard (`apps/admin-dashboard/package.json`)
- **Next.js**: `^14.1.0` → `^14.2.0` (latest 14.x)
  - Better performance, improved image optimization
- **TailwindCSS**: `^3.4.1` → `^3.4.3` (latest)
- **Lucide React**: `^0.331.0` → `^0.384.0` (latest)

---

## 2. Code Refactoring & Optimization

### A. Performance Improvements

#### Backend (`apps/server`)
```
- Connection pooling for Redis (ioredis native pools)
- Database query optimization in Prisma
  - Add missing indexes in schema.prisma
  - Implement query result caching for frequently accessed data
- API route optimization
  - Add compression middleware (Brotli for production)
  - Implement request/response caching headers
  - Add rate limiting middleware
```

#### React Native Apps (Rider & Driver)
```
- Lazy load screens using Expo Router code splitting
- Optimize image loading with expo-image instead of Image
- Implement FlatList virtualization for lists
- Memory leak fixes:
  - Review useEffect cleanup functions
  - Cancel fetch requests on unmount
  - Unsubscribe from listeners properly
- Bundle size reduction:
  - Remove unused expo modules
  - Tree-shake unused dependencies
```

#### Admin Dashboard
```
- Server-side rendering optimization (Next.js SSR/ISR)
- Image optimization with next/image
- Dynamic imports for heavy components
- Cache control headers for static assets
```

### B. Code Quality Refactoring

#### Type Safety (Priority: HIGH)
- Fix shared package type errors in `@namma/ui`
  - Remove `className` from RN components (use `style` instead)
  - Add proper TypeScript types for all component props
  - Enable `strict: true` in driver app's tsconfig.json

#### Error Handling Standardization
```typescript
// Create unified error handling layer
packages/common/src/errors.ts
  - Custom error classes (AppError, ValidationError, AuthError, DatabaseError)
  - Centralized error logging
  - Consistent error response formats
```

#### API Contract Layer
```typescript
// Strengthen type safety between frontend/backend
packages/common/src/api-types.ts
  - Define all request/response types with Zod
  - Export types to both server and clients
  - Enable type-safe API client generation
```

#### Test Coverage Setup
```
apps/server:
  - Add Jest + Supertest for API testing
  - Test critical routes: auth, payments, notifications
  
packages/common:
  - Add validation tests for all Zod schemas
  
apps/rider, apps/driver:
  - Add React Native Testing Library setup
```

---

## 3. Configuration & Setup Fixes

### A. ESLint & Prettier (Missing)
Create root `.eslintrc.json`:
```json
{
  "root": true,
  "extends": ["turbo", "eslint:recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "overrides": [
    {
      "files": "*.ts",
      "extends": ["eslint:recommended"],
      "parser": "@typescript-eslint/parser"
    }
  ]
}
```

Create root `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### B. GitHub Actions CI/CD
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
```

### C. Missing Environment Files
Add proper `.env` files for each app:

`apps/rider/.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=${MAPBOX_TOKEN}
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
```

`apps/driver/.env` (similar structure)

`apps/server/.env`:
- Consolidate from `.env.example`
- Add validation at startup (use Zod)

### D. Monorepo Build Configuration

Update `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.json", ".eslintrc.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".expo/**"],
      "cache": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": true
    },
    "typecheck": {
      "cache": true
    },
    "test": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Update root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "composite": true
  },
  "extends": "expo/tsconfig.base"
}
```

---

## 4. Project Structure & Missing Files

### A. Add Missing Documentation
```
README.md — Project overview, setup, architecture
ARCHITECTURE.md — Monorepo structure, data flow
CONTRIBUTING.md — Development guidelines
docs/
  ├── API.md — Backend API documentation
  ├── MOBILE_SETUP.md — React Native development setup
  ├── DATABASE.md — Schema documentation
  └── DEPLOYMENT.md — Production deployment guide
```

### B. Add Missing Build/Dev Scripts
Update root `package.json`:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "build:deps": "turbo run build --filter=./packages",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:setup": "npm run -w @namma/db prisma:push",
    "db:seed": "npm run -w @namma/db seed"
  }
}
```

### C. Add Missing Package Scripts
Update each package's `package.json`:
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "clean": "rm -rf dist .next .expo"
  }
}
```

---

## 5. Database & ORM Optimization

### A. Prisma Schema Enhancements (`packages/db/prisma/schema.prisma`)
```prisma
// Add indexes for frequently queried columns
model User {
  // ... existing fields
  @@index([email])
  @@index([phone])
}

model Ride {
  // ... existing fields
  @@index([driverId])
  @@index([riderId])
  @@index([createdAt])
}

// Add composite indexes for common queries
@@index([status, createdAt])
```

### B. Connection Management
- Enable connection pooling in DATABASE_URL
- Add PgBouncer configuration for production
- Implement health checks in server startup

---

## 6. Security Hardening

### A. Authentication & Authorization
```
- Implement JWT token refresh strategy
- Add role-based access control (RBAC)
- Validate all inputs with Zod schemas
- Implement CORS properly for cross-origin requests
```

### B. Secrets Management
```
- Use .env files only for development
- Implement environment variable validation at startup
- Document required secrets in .env.example
- Add GitHub Secrets for CI/CD
```

### C. API Security
```
- Add rate limiting middleware
- Implement request signing for mobile apps
- Add API key authentication for services
- Validate webhook signatures (PhonePe)
```

---

## 7. Monitoring & Observability

### A. Logging
Create `packages/common/src/logger.ts`:
```typescript
- Structured logging (JSON format)
- Log levels: debug, info, warn, error
- Centralized log aggregation setup
```

### B. Error Tracking
- Integrate Sentry or similar error tracking
- Setup performance monitoring
- Add request tracing for debugging

---

## 8. Deployment & DevOps

### A. Docker Setup
Create Dockerfile for backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

### B. Railway/Vercel Deployment
- Update `vercel.json` for multi-app deployment
- Add health check endpoints
- Implement graceful shutdown

---

## 9. Testing Strategy

### Backend (`apps/server`)
```
jest.config.js
- Unit tests for services
- Integration tests for API endpoints
- Test database seeding and cleanup
```

### Mobile Apps
```
Testing library setup
- Component snapshot tests
- Navigation flow tests
- API integration mocks
```

### Shared Packages
```
packages/common, packages/db
- Validation schema tests
- Type tests (tsd)
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Update all dependencies
- [ ] Add ESLint & Prettier configuration
- [ ] Fix TypeScript strict mode issues
- [ ] Add GitHub Actions CI/CD

### Phase 2: Code Quality (Week 2-3)
- [ ] Refactor error handling
- [ ] Add comprehensive type definitions
- [ ] Fix @namma/ui className issues
- [ ] Setup test infrastructure

### Phase 3: Optimization (Week 3-4)
- [ ] Performance optimizations (caching, bundling)
- [ ] Database query optimization
- [ ] Security hardening
- [ ] Add monitoring/logging

### Phase 4: Documentation & DevOps (Week 4)
- [ ] Complete documentation
- [ ] Docker setup
- [ ] Deployment automation
- [ ] Final testing & validation

---

## Success Metrics

- ✅ All TypeScript strict mode checks passing
- ✅ ESLint with 0 errors
- ✅ Test coverage >70% for critical paths
- ✅ Build time <5min for full monorepo
- ✅ No bundle size increase
- ✅ Zero security vulnerabilities
- ✅ All CI/CD checks passing
- ✅ Complete documentation in place

---

## Notes

- Dependencies: Most packages follow semantic versioning, safe to upgrade within major versions
- Breaking changes likely only in Expo Router v4 (requires navigation pattern updates)
- Driver app's `strict: false` should be addressed as part of type safety improvements
- Consider migrating from Prisma to Drizzle for better performance (future)
