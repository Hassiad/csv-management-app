# Multi-stage build optimized for Railway
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production --ignore-scripts && \
    cd backend && npm ci --only=production --ignore-scripts && \
    cd ../frontend && npm ci --ignore-scripts

# Frontend build stage
FROM base AS frontend-builder

# Install frontend dev dependencies for build
RUN cd frontend && npm ci

# Copy frontend source
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Final production stage
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --only=production --ignore-scripts && \
    cd backend && npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy backend source
COPY backend/src/ ./backend/src/

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create uploads directory with proper permissions
RUN mkdir -p uploads backend/uploads && \
    chown -R nodejs:nodejs uploads backend/uploads

# Switch to non-root user
USER nodejs

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-5000}

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/src/app.js"]