# Use python-slim to reduce image size and vulnerability count
FROM python:3.11-slim-bookworm

# Standard security environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a dedicated user so we don't run as root
RUN adduser --disabled-password --gecos "" signaluser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R signaluser:signaluser /app

# Non-root context
USER signaluser

EXPOSE 8080

# Gunicorn is safer for production than the Flask built-in server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]