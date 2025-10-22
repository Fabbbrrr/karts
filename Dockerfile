# RaceFacer Analysis Server Dockerfile

# Use Node.js LTS version
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user (security best practice)
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=appuser:appuser server/package*.json ./

# Install dependencies with exact versions
RUN npm ci --only=production && npm cache clean --force

# Copy server source code
COPY --chown=appuser:appuser server/ ./

# Create required directories
RUN mkdir -p storage logs && chown -R appuser:appuser storage logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "index.js"]
