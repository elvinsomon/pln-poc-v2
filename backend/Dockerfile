# Backend FastAPI + clasificador. Los artefactos del modelo se montan como volumen
# (ver docker-compose.yml), así la imagen queda ligera.
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # El modelo se carga desde el artefacto LOCAL; evita cualquier llamada a HF Hub.
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    # BD en el volumen /data (persiste entre arranques).
    DB_URL=sqlite:////data/app.db

# Dependencias. torch se instala desde el índice CPU de PyTorch para evitar
# arrastrar las librerías CUDA de NVIDia (inútiles en CPU y ~GB). Luego el resto
# desde PyPI: 'torch>=2.2' de requirements ya queda satisfecho y no se reinstala.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip \
 && pip install --index-url https://download.pytorch.org/whl/cpu torch \
 && pip install -r /app/backend/requirements.txt

# Código fuente (paquete compartido + backend). Los artefactos NO se copian
# (.dockerignore los excluye); se montan en tiempo de ejecución.
COPY common /app/common
COPY backend /app/backend

EXPOSE 8000

# Siembra demo idempotente (solo si la BD está vacía) y luego levanta la API.
CMD ["sh", "-c", "python -m backend.seed_demo && exec uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
