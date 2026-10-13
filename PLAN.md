# GenoScope — Project Plan

## 1. Objective
A web app where a user uploads a DNA FASTA file and gets:
- **Analysis:** length, base counts, GC content, sliding-window GC, k-mer profile
- **ML prediction:** origin superkingdom (Archaea, Bacteria, Eukaryota, Virus) with class probabilities

## 2. Principles
- Write as little code as possible.
- Use a library whenever one already does the job; never reimplement it.
- Repeated logic lives in one reusable function/component.

## 3. Scope
- **In:** FASTA upload (single/multi-record), composition analysis, k-mer profile (k = 4), superkingdom classifier, interactive results page, tests, Docker, CI
- **Out:** FASTQ, ORFs, alignment, user accounts, databases, Hugging Face / deep learning models, large genomes (cap ~5 MB)

## 4. Architecture
```
[React + Ant Design]  ──upload──▶  [FastAPI backend]
  @ant-design/plots                ├── parsing & validation   (Biopython)
                                   ├── analysis               (Biopython, pandas)
                                   └── classifier             (scikit-learn Pipeline, joblib)
```

## 5. Library map
| Task | Library |
|---|---|
| FASTA parsing | `Bio.SeqIO` |
| GC content | `Bio.SeqUtils.gc_fraction` |
| Base counts | `collections.Counter` |
| Sliding-window GC | `pandas.Series.rolling().mean()` |
| k-mer features | `sklearn CountVectorizer(analyzer="char", ngram_range=(4, 4))` |
| Training | `sklearn Pipeline` + `GridSearchCV` |
| Leakage-free model selection | `sklearn GroupKFold` (grouped by taxid) |
| Metrics | `classification_report`, `ConfusionMatrixDisplay` |
| Model persistence | `joblib` |
| Data download | `remotezip` (extracts one file from the remote OSF zip), `requests` |
| Taxid → superkingdom labels | `taxopy` + NCBI taxonomy dump |
| API / validation | FastAPI `UploadFile` + Pydantic |
| UI components | Ant Design 6 |
| Charts | @ant-design/plots |
| API state | TanStack Query |
| TS types | `openapi-typescript` (generated from FastAPI schema) |
| Tests | pytest (`parametrize`), FastAPI `TestClient` |
| Tooling | uv (Python), Vite (frontend), ruff, Docker Compose, GitHub Actions |

## 6. Repository structure
```
.
├── backend/
│   ├── app/       main.py, analysis.py, classifier.py, schemas.py
│   └── tests/
├── ml/            download_data.py, prepare_data.py, train.py, MODEL_CARD.md
├── frontend/src/  api/, components/ (ChartCard, SummaryCard, GCPlot, PredictionChart, KmerChart), pages/
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## 7. Phases
1. **Setup (½ day)** — repo, uv project, Vite + React + Ant Design, ruff, CI.
2. **Data (½ day)**
   - Download BERTax fragments from OSF (DOI 10.17605/OSF.IO/QG6MV); verify format and size.
   - Convert to `sequence, label, genus` rows; subsample ~20–50k per class (balanced, fixed seed); save Parquet.
   - Split train/test by genus (or use BERTax's "unknown genera" set).
   - DeepMicroClass benchmark (Figshare) as external test set; map labels, drop plasmids.
3. **Features (minutes)** — `CountVectorizer` k = 4 inside the sklearn `Pipeline`; drop fragments with many `N`s.
4. **Model (1 day)** — logistic regression baseline vs. random forest vs. HistGradientBoosting; macro F1, per-class metrics, confusion matrix; evaluate on held-out and external sets; save with `joblib`; write `MODEL_CARD.md`.
5. **Backend (1 day)** — `POST /analyze`, `GET /health`; one `analyze_record()` per FASTA record; classify in 1,500 bp windows and average probabilities; min length ~1,000 bp; Pydantic schemas.
6. **Frontend (1 day)** — AntD `Layout`; `Upload.Dragger` + paste tab + "Try example"; results page with summary card (left), GC line plot with zoom slider, probability bar chart, k-mer chart; shared `ChartCard` wrapper; `useAnalyze()` hook; sequence `Select`; JSON export.
7. **Testing (½ day)** — unit tests for analysis + parser edge cases, API tests, model sanity test; CI runs lint + tests.
8. **Packaging (½ day)** — `docker compose up`; README with screenshots, quick start, model performance, limitations.

**Estimate:** ~4–5 days. MVP = phases 1–5 + basic UI.

## 8. Risks
| Risk | Mitigation |
|---|---|
| Data leakage inflates accuracy | Genus-level split + external test set |
| Short sequences unreliable | Minimum length, low-confidence warning |
| BERTax data large / format unclear | Inspect first, subsample |
| Time overrun | Ship MVP first |
