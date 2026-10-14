# GenoScope

[![CI](https://github.com/hayatmalik/genoscope/actions/workflows/ci.yml/badge.svg)](https://github.com/hayatmalik/genoscope/actions/workflows/ci.yml)

Upload a DNA FASTA file and get its composition, a sliding-window GC profile, a six-frame map of open reading frames
and a machine-learning prediction of its origin superkingdom (Archaea, Bacteria, Eukaryota, Viruses).

**Stack:** FastAPI · Biopython · pandas · scikit-learn · React · Ant Design · @ant-design/plots · TanStack Query · Docker

How each part was built is described in [DOCUMENTATION.md](DOCUMENTATION.md); the model's data and evaluation in
[ml/MODEL_CARD.md](ml/MODEL_CARD.md).

## Setup

```bash
docker compose up --build        # → http://localhost:8080
```

Local development (requires [uv](https://docs.astral.sh/uv/) and Node 20):

```bash
uv sync
uv run uvicorn app.main:app --app-dir backend --reload       # API on :8000
cd frontend && npm install && npm run dev                    # UI on :5173
```

Use **Try an example** on the start page, or upload a file from [test_sequences/](test_sequences/).

Retrain the model (optional):

```bash
uv run --group ml python ml/download_data.py
uv run --group ml python ml/prepare_data.py
uv run --group ml python ml/train.py
```

## Project layout

```
backend/app/       main.py (API) · analysis.py · schemas.py
backend/tests/     pytest suite
ml/                data download, preparation, training, model card, trained model
frontend/src/      api/ (client + generated types) · components/ · pages/
test_sequences/    sample FASTA files for manual testing
```

## Tests

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check .
cd frontend && npm run lint && npm run build
```
