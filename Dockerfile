# Build stage
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (skip prepare scripts like husky)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies (skip prepare scripts like husky)
RUN npm ci --only=production --ignore-scripts

# Copy built application from builder BEFORE changing user
COPY --from=builder /app/dist ./dist

# Generate Prisma Client in production image
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of app directory (AFTER copying everything)
RUN chown -R nestjs:nodejs /app

# Debug: List dist contents
RUN ls -la /app/dist

# Switch to non-root user
USER nestjs

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Start the application
CMD ["node", "dist/main"]
