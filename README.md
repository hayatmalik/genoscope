# GenoScope

[![CI](https://github.com/hayatmalik/genoscope/actions/workflows/ci.yml/badge.svg)](https://github.com/hayatmalik/genoscope/actions/workflows/ci.yml)

Upload a DNA FASTA file and get its composition, a sliding-window GC profile, its 4-mer profile and a machine-learning
prediction of its origin superkingdom (Archaea, Bacteria, Eukaryota, Viruses).

**Stack:** FastAPI · Biopython · pandas · scikit-learn · React · Ant Design · @ant-design/plots · TanStack Query · Docker

## Quick start

```bash
docker compose up --build        # → http://localhost:8080
```

Local development (requires [uv](https://docs.astral.sh/uv/) and Node 20):

```bash
uv sync
uv run uvicorn app.main:app --app-dir backend --reload       # API on :8000
cd frontend && npm install && npm run dev                    # UI on :5173 (proxies /api)
```

Click **Try an example** on the start page to analyse one held-out sequence per superkingdom.

## How it works

```
React + Ant Design ──POST /api/analyze──▶ FastAPI
                                          ├─ Bio.SeqIO          parse & validate FASTA
                                          ├─ gc_fraction/pandas GC content, sliding-window GC
                                          └─ sklearn Pipeline   4-mer counts → frequencies → HistGradientBoosting
```

The trained `Pipeline` contains the k-mer vectorizer, so training and inference share one feature implementation,
and the UI's k-mer chart shows exactly what the model sees. Frontend types are generated from FastAPI's OpenAPI
schema (`npm run gen:api`).

## Model

Trained on the BERTax dataset with a test set of **genera never seen in training**: **0.80 macro F1** per 1,500 bp
fragment. Details, data provenance and limitations: [ml/MODEL_CARD.md](ml/MODEL_CARD.md).

Retrain:

```bash
uv run --group ml python ml/download_data.py   # ~290 MB download (BERTax subset + NCBI taxonomy), ~1.3 GB on disk
uv run --group ml python ml/prepare_data.py    # labels, balances, writes Parquet + example FASTA
uv run --group ml python ml/train.py           # model selection (~10 min), evaluation, writes ml/models/
```

The raw files in `ml/data/` can be deleted after `prepare_data.py`; training only needs the Parquet files.

## Project layout

```
backend/app/     main.py (API) · analysis.py · schemas.py
backend/tests/   pytest suite
ml/              data download, preparation, training, model card, trained model
frontend/src/    api/ (client + generated types) · components/ · pages/
```

## Tests

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check .
cd frontend && npm run lint && npm run build
```
