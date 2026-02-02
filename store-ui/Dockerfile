FROM python:3.12.3-slim

WORKDIR /app

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app

USER appuser

EXPOSE 8080

CMD ["gunicorn", "-b", "0.0.0.0:8080", "app.main:app"]
