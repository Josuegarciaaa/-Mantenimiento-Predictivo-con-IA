# Dockerfile para el servicio ML (Python)
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY configs/ ./configs/
COPY trained_models/ ./trained_models/

EXPOSE 5000

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
