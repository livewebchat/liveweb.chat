# Step 1: Use official Node.js image as base
FROM node:18-alpine

# Step 2: Set working directory in container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json to the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the React app for production
RUN npm run build

# Step 7: Use an official NGINX container to serve the built app
FROM nginx:alpine

# Step 8: Copy build output to NGINX public folder
COPY --from=0 /app/build /usr/share/nginx/html

# Step 9: Expose port 80 for the web traffic
EXPOSE 80

# Step 10: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
