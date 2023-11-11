# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Expose the port that your Next.js app is running on
EXPOSE 3000

# Start your application
CMD ["npm", "run", "dev"]
