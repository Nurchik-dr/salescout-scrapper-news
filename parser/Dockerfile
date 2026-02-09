FROM node:20-slim

# Install dependencies for native modules (node-vad, tensorflow)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create tmp directory for video processing
RUN mkdir -p tmp

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "src/index.js"]