# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy both package.json files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/

# Install dependencies
RUN npm install
RUN npm install --prefix server

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/

# Install only production dependencies
RUN npm install --production
RUN npm install --production --prefix server

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
