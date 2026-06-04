# ──────────────────────────────────────────────────────────────────────────────
# Therabo — single-image production build.
# Stage 1 builds the React frontend with Vite.
# Stage 2 builds the TS server and copies the frontend's dist into ./public so
# the same Express process serves the API + the static SPA.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: client build ──
FROM node:20-alpine AS client
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ── Stage 2: server build ──
FROM node:20-alpine AS server
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY server/ ./
# sharp + better-sqlite3 ship prebuilt binaries that work on alpine/glibc
# variants; they are installed in `npm install` above.
RUN npx tsc -p tsconfig.json

# ── Stage 3: runtime ──
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Only production dependencies — keeps the image small
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund \
 && npm cache clean --force

# Copy server build + the frontend bundle into ./public (where index.ts looks)
COPY --from=server /app/dist ./dist
# Also keep the seed source so the seed script can re-import frontend products
# on the very first start (after that, products live in the SQLite db).
COPY src/data ./src/data
COPY --from=client /app/dist ./public

# Data + uploads persist across container restarts via mounted volumes
RUN mkdir -p ./data ./uploads
VOLUME ["/app/data", "/app/uploads"]

EXPOSE 8080
CMD ["node", "dist/index.js"]
