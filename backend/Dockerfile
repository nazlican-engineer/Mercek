# API için Python çalışma ortamını hazırlıyoruz.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# Önce kütüphaneleri kuruyoruz; kod değişince tekrar indirilmezler.
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Yalnızca API kodunu ve hazırlanmış sentetik ambarı alıyoruz.
COPY backend/ ./backend/
COPY data/processed/warehouse.duckdb ./data/processed/warehouse.duckdb

# Uygulamayı yönetici yetkisi olmadan çalıştırıyoruz.
RUN useradd --uid 10001 --no-create-home appuser \
    && chmod 444 /app/data/processed/warehouse.duckdb
USER appuser
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
