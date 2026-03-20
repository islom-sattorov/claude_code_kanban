FROM node:22-slim

# Install git (required by Claude Code CLI for repo-aware operations)
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Copy root workspace manifest so npm workspaces resolves correctly
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/package.json ./server/

# Install all workspace deps (hoisted to root node_modules)
RUN npm install --workspace=server

# Copy server source
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/

WORKDIR /app/server

EXPOSE 3001

CMD ["../node_modules/.bin/tsx", "src/index.ts"]
