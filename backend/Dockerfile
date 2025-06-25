FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Drizzle files
RUN npm run db:generate

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]
