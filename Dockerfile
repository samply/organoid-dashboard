FROM node AS builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
COPY src ./src
RUN npm run build

# Production image
FROM nginx AS runner
COPY --from=builder /app/build /usr/share/nginx/html
