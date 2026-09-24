# syntax=docker/dockerfile:1.6
FROM golang:1.26.8-alpine3.24 AS build
WORKDIR /src
# hadolint ignore=DL3008,DL3018
RUN apk add --no-cache ca-certificates git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/payment ./cmd/payment
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=build --chown=nonroot:nonroot /out/payment /payment
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER nonroot:nonroot
EXPOSE 5003
ENTRYPOINT ["/payment"]
