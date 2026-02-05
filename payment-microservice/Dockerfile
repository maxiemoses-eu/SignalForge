# Changed from 1.22 to 1.23 to match go.mod requirements
FROM golang:1.23-alpine AS build
WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary for scratch
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage: minimal runtime environment
FROM scratch
COPY --from=build /app/main /main
EXPOSE 5003
ENTRYPOINT ["/main"]