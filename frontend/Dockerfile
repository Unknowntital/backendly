# Stage 1: Build React App
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
