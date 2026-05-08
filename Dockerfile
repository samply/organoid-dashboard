FROM node AS builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
COPY . .
RUN npx vite build

# Production image
FROM nginx AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --chmod=+x 40-load-env-vars.sh /docker-entrypoint.d/40-load-env-vars.sh
