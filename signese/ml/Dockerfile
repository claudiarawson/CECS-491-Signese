FROM python:3.11-slim

# OpenCV / mediapipe runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python deps first for better layer caching
COPY cloudrun/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy only what's needed for serving
COPY cloudrun/cloudrun_app.py /app/cloudrun_app.py
COPY scripts/serve_first_model_api.py /app/serve_first_model_api.py

ENV PYTHONPATH=/app
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "cloudrun_app:app", "--host", "0.0.0.0", "--port", "8080"]

