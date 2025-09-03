# Use Node.js 20 as base
FROM node:20.18.2

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all files and build the production version
COPY . .
RUN npm run build

# Install 'serve' globally to serve the build directory
RUN npm install -g serve

# Expose port 3000 for the app
EXPOSE 3000

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]
