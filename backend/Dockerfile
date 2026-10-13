# Build context: repository root
FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:0.13 /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app backend/app
COPY ml/models/classifier.joblib ml/models/classifier.joblib
ENV MODEL_PATH=/app/ml/models/classifier.joblib
EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
