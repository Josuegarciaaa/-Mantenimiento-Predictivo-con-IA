FROM python:3.12-slim

WORKDIR /usr/src/app

COPY requirements.txt ./

# Instalar dependencias del sistema para PostgreSQL y compilacion
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

ENV PORT=5000

CMD ["python", "app.py"]
