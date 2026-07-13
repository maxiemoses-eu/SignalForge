# Use a Maven image to build the application
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only the pom.xml first to download dependencies
COPY pom.xml .
# This layer will be cached unless pom.xml changes
RUN mvn dependency:go-offline -B

# Copy the rest of the source code and build
COPY src ./src
RUN mvn package -DskipTests

# Use a smaller JRE image for the final container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add a non-root user
RUN addgroup -S signalforge && adduser -S spring -G signalforge

# Patch base image to reduce Trivy findings
RUN apk update && apk upgrade --no-cache

COPY --from=build /app/target/*.jar app.jar
# Change ownership to the non-root user
RUN chown spring:signalforge app.jar

# Switch to non-root user
USER spring
EXPOSE 1001
ENTRYPOINT ["java", "-jar", "app.jar"]