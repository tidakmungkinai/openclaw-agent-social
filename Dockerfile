FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 18790

# Run
CMD ["npm", "start"]
