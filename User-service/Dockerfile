FROM python:3.11-slim

RUN adduser --disabled-password appuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
USER appuser

HEALTHCHECK CMD python -c "import requests; requests.get('http://localhost:5000/health')"

CMD ["python", "app.py"]
