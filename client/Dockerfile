# Use a lightweight Node.js image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the client files
COPY . .

# Build the React app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Serve the build folder
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
