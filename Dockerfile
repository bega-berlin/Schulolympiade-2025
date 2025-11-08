# Node.js Schulolympiade Services Dockerfile
# Multi-stage build for optimized production image

FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy shared modules
COPY shared/ ./shared/

# Final stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy node modules from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/shared ./shared

# Create data directories for logs
RUN mkdir -p /app/dashboard/public/data && \
    mkdir -p /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/api/stats', (r) => {if (r.statusCode === 200) process.exit(0); process.exit(1)}).on('error', () => process.exit(1))" || exit 1

# Default command (will be overridden by docker-compose for each service)
CMD ["node", "dashboard/server.js"]
