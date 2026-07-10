# Multi-stage build for ultra-small container image size
# Stage 1: Build client and server assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the entire codebase
COPY . .

# Build client assets and compile backend TypeScript server to CJS
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Copy package.json to manage production node_modules
COPY package*.json ./

# Install only production dependencies (excluding devDependencies to keep container light)
RUN npm ci --only=production

# Copy built assets and compiled backend from build stage
COPY --from=builder /app/dist ./dist

# Expose the Cloud Run default port (injected dynamically via PORT env variable)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
