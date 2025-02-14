# Use Node.js Alpine image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install
RUN npm install --save-dev @types/pg # Ensure TypeScript recognizes 'pg'

# Copy the rest of the application
COPY . .

# Build TypeScript files
RUN npm run build

# Set command to start server
CMD ["node", "dist/index.js"]
