# ZMOS MoveOS Backend

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

A multi-tenant SaaS backend built with NestJS, featuring secure authentication, automatic tenant isolation, and scalable architecture.

## Features

- 🔐 **JWT Authentication** with bcrypt password hashing
- 🏢 **Multi-tenant Architecture** with automatic data isolation
- 📊 **Prisma ORM** with PostgreSQL and client extensions
- 🏗️ **NestJS Framework** with modular architecture
- 🛡️ **Global Guards & Middleware** for security
- 📝 **Conventional Commits** with automated tooling

## Architecture

### Multi-Tenancy
- Shared database with isolated schemas
- Tenant resolution via `x-tenant-id` header
- Automatic query filtering using Prisma extensions
- CLS (Continuation Local Storage) for request-scoped context

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Public routes with `@Public()` decorator
- Global authentication guard

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Capra-Nubiana/ZMOS.git
cd zmos-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### Development

```bash
# Start development server with hot reload
npm run start:dev

# Run tests
npm run test

# Run linter
npm run lint

# Format code
npm run format
```

## API Endpoints

### Authentication

All authentication endpoints are public and do not require the `x-tenant-id` header.

```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "tenantName": "My Company"
}
```

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Protected Routes

All other routes require:
- `Authorization: Bearer <jwt-token>` header
- `x-tenant-id: <uuid>` header

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                 # Data transfer objects
│   ├── auth.controller.ts   # Auth endpoints
│   ├── auth.service.ts      # Auth business logic
│   ├── jwt.strategy.ts      # Passport JWT strategy
│   └── public.decorator.ts  # Public route decorator
├── common/                  # Shared utilities
│   └── tenant.middleware.ts # Tenant validation middleware
├── prisma/                  # Database service
│   └── prisma.service.ts    # Extended Prisma client
└── app.module.ts           # Root application module
```

## Commit Conventions

This project follows [Conventional Commits](https://conventionalcommits.org/) specification.

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

### Examples

```bash
# Interactive commit (recommended)
npm run commit

# Or manual commit
git commit -m "feat(auth): implement JWT token validation"
git commit -m "fix(db): resolve tenant isolation bug"
git commit -m "docs(readme): update API documentation"
```

See [COMMIT_CONVENTIONS.md](./COMMIT_CONVENTIONS.md) for detailed guidelines.

## Development Workflow

### Strict Branching & History
> [!IMPORTANT]
> All new work must branch off `develop`. A linear commit history is mandatory.

See [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) for detailed instructions on:
- Branch naming: `capra-nubiana/{type}/{description}`
- Conventional commit standards
- PR process and squash-merge requirements
- Deployment pipelines

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/zmos_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Application
NODE_ENV="development"
PORT=3000
```

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Production Checklist

- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow commit conventions (`npm run commit`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Projects

- [ZMOS Frontend](https://github.com/Capra-Nubiana/ZMOS) - React-based admin dashboard
- [ZMOS Mobile](https://github.com/Capra-Nubiana/ZMOS-mobile) - React Native mobile app
- [ZMOS Documentation](https://github.com/Capra-Nubiana/ZMOS-docs) - API documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
