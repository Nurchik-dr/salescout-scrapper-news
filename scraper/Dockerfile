FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -D typescript ts-node @types/node

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npx", "ts-node", "src/index.ts"]