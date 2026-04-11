# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

ARG REACT_APP_API_URL=http://localhost:5000/api/v1
ARG REACT_APP_WS_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
# Prevent react-scripts from treating warnings as build errors
ENV CI=false

RUN npm run build

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Accept the backend origin so it can be baked into the CSP header.
# Example values:
#   https://api.example.com wss://api.example.com   (production)
#   http://localhost:5000 ws://localhost:5000         (local dev)
# Default is localhost-scoped for safety; production builds must pass this arg explicitly.
ARG BACKEND_ORIGIN=http://localhost:5000 ws://localhost:5000
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

# Copy nginx template and substitute the BACKEND_ORIGIN placeholder
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN envsubst '${BACKEND_ORIGIN}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/default.conf.template

# Copy the React build output
COPY --from=builder /app/build /usr/share/nginx/html

# Ensure correct permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
