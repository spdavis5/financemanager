# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder

# Install build dependencies for bcrypt and OpenSSL for Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma and build dependencies for bcrypt
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

# Copy package files and install production dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Rebuild bcrypt for this container
RUN npm rebuild bcrypt

# Generate Prisma client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy server build
COPY --from=server-builder /app/server/dist ./dist

# Copy client build to be served statically
COPY --from=client-builder /app/client/dist ./public

# Clean up build dependencies but keep openssl
RUN apk del python3 make g++ && rm -rf /var/cache/apk/*

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
