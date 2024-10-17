# Use the official Node.js image for building the app
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build your React app
RUN npm run build

# Use the official Apache image to serve the app
FROM httpd:alpine

# Copy the build output to Apache's document root
COPY --from=build /app/build/ /usr/local/apache2/htdocs/

# Expose the desired port (default for Apache is 80)
EXPOSE 80
