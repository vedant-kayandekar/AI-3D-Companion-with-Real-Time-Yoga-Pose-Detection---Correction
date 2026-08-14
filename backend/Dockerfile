# Use Node.js 22 (latest stable)
FROM node:22

# Install ffmpeg for lip-sync processing
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory inside the container
WORKDIR /app

# Copy all project files into the container
COPY . .

# Install dependencies with Yarn
RUN yarn install

# Start your service
CMD ["node", "aiService.js"]