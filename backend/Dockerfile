# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY src ./src

# Expose the port your Node.js application will run on
EXPOSE 8080

ENV NODE_ENV=development
# Command to start your Node.js application
CMD [ "npm","start"]
