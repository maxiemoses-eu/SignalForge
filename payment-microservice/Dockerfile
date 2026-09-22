# Build stage: matches go.mod requirement (go 1.25.0)
FROM golang:1.25.7-alpine3.21 AS build
WORKDIR /app

# Install git for fetching dependencies and security tools
RUN apk add --no-cache \
    git=2.47.3-r0 \
    ca-certificates=20260909-r0

# Copy dependency files first to leverage Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary with CGO disabled for maximum portability
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo \
    -ldflags="-s -w" \
    -o main .

# Final stage: hardened, minimal runtime environment
# distroless is security-first: no shell, no package manager, no bloat
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /

# Copy only the compiled binary from build stage
COPY --from=build --chown=nonroot:nonroot /app/main /main

# Copy CA certificates for HTTPS calls
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 5003

# Run as nonroot user (distroless default), no shell fallback
ENTRYPOINT ["/main"]
