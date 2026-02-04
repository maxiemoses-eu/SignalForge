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
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]