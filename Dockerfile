# Multi-stage build for Node.js application
FROM node:18-alpine AS frontend-builder

# Accept build arguments for Supabase configuration
# These are needed at build time because Vite embeds them in the bundle
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend (will use env vars if provided, otherwise fallback values from code)
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Modify server.js for production deployment using Node.js script
RUN node modify-server.js && rm modify-server.js

# Expose port (Hugging Face Spaces uses 7860)
EXPOSE 7860

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server.js"]

