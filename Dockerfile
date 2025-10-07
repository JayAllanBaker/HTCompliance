# Use Node.js 22 Alpine as base image
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code (server, client, shared)
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY vite.config.ts tsconfig.json drizzle.config.ts tailwind.config.ts postcss.config.js ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Build the application (builds both frontend with Vite and backend with esbuild)
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Install postgresql-client for pg_isready command
RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application and necessary runtime files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared
COPY --from=deps /app/node_modules ./node_modules

# Copy drizzle-kit from builder (it's in devDependencies)
COPY --from=builder /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=builder /app/node_modules/.bin/drizzle-kit ./node_modules/.bin/drizzle-kit

# Copy entrypoint script from builder stage
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint.sh

# Ensure Unix LF line endings (fixes Windows CRLF issues)
RUN sed -i 's/\r$//' /docker-entrypoint.sh

# Ensure the script is executable and owned by our non-root user
RUN chmod +x /docker-entrypoint.sh && chown nextjs:nodejs /docker-entrypoint.sh

# Default Postgres connection envs (can be overridden by --env-file)
ENV PGHOST=postgres
ENV PGUSER=postgres
ENV PGDATABASE=htdb

USER nextjs

EXPOSE 5000
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/user', (r) => {process.exit(r.statusCode === 401 || r.statusCode === 200 ? 0 : 1)})"

# Run entrypoint then start the app
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
