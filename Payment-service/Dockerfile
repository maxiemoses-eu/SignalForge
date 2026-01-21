FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM scratch
COPY --from=build /app/app /app
EXPOSE 5003
ENTRYPOINT ["/app"]
