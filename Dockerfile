FROM node:20-alpine

WORKDIR /app

# Install dependencies (including devDependencies for development)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the server in development mode
CMD ["npm", "run", "dev"]
