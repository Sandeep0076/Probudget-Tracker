# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend code
COPY server ./server

# Expose port (Northflank will assign PORT env variable)
EXPOSE 4000

# Start command
CMD ["node", "server/index.js"]
