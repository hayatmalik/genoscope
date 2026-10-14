# GenoScope — Project Plan (local only, not in git)

## 1. Objective
A web app where a user uploads a DNA FASTA file and gets:
- **Analysis:** length, base counts, GC content, sliding-window GC, six-frame ORF map with coding density
- **ML prediction:** origin superkingdom (Archaea, Bacteria, Eukaryota, Viruses) with class probabilities

Goal: a small portfolio project that combines genomics, data analysis, ML and software engineering.

## 2. Principles
- Write as little code as possible.
- Use a library whenever one already does the job; never reimplement it.
- Repeated logic lives in one reusable function/component.
- Keep README current with every change; ask before every `git push`.

## 3. Scope
- **In:** FASTA upload (single/multi-record), composition analysis, sliding-window GC, ORFs, superkingdom classifier,
  interactive results page, tests, Docker, CI
- **Out:** FASTQ, alignment, gene prediction beyond simple ORFs, user accounts, databases, Hugging Face / deep
  learning models, inputs > 5 MB

## 4. Architecture
```
[React + Ant Design]  ──POST /api/analyze──▶  [FastAPI backend]
  @ant-design/plots                           ├── parsing & validation   (Biopython)
                                              ├── composition, GC        (Biopython, pandas)
                                              ├── ORFs                   (orfipy, numpy)
                                              └── classifier             (scikit-learn Pipeline, joblib)
```

## 5. Library map
| Task | Library |
|---|---|
| FASTA parsing | `Bio.SeqIO` |
| GC content | `Bio.SeqUtils.gc_fraction` |
| Base counts | `collections.Counter` |
| Sliding-window GC | `pandas.Series.rolling().mean()`; blocks of windows averaged to ≤ 1,000 points |
| ORFs (ATG→stop, ≥ 300 bp, six frames) | `orfipy`; coding density via `numpy` mask |
| k-mer features | `sklearn CountVectorizer(analyzer="char", ngram_range=(4, 4))` + `Normalizer(l1)` |
| Training / selection | `sklearn Pipeline` + `GridSearchCV` + `GroupKFold` (grouped by taxid) |
| Metrics | `classification_report`, `ConfusionMatrixDisplay` |
| Model persistence | `joblib` |
| Data download | `remotezip` (one file from the remote OSF zip), `requests` |
| Taxid → superkingdom labels | `taxopy` + NCBI taxonomy dump |
| API / validation | FastAPI `UploadFile` + Pydantic |
| UI | Ant Design 6 (`Table`, `Card`, `Statistic`, `Descriptions`, `Upload`, …) |
| Charts | @ant-design/plots (`Line`, `Bar`, `Pie`, range bars) |
| Sequence viewer | `@rc-component/virtual-list`, `@rc-component/resize-observer` (Ant Design's own) |
| API state | TanStack Query |
| TS types | `openapi-typescript` (`npm run gen:api`) |
| Tests | pytest (`parametrize`), FastAPI `TestClient` |
| Tooling | uv (Python 3.11), Vite + Node 20, ruff, ESLint, Docker Compose, GitHub Actions |

## 6. Repository structure
```
.
├── backend/
│   ├── app/       main.py (API + validation), analysis.py, schemas.py
│   └── tests/     test_api.py
├── ml/            download_data.py, prepare_data.py, train.py, MODEL_CARD.md, models/ (classifier.joblib, metrics)
├── frontend/src/
│   ├── api/       client.ts (useAnalyze), schema.ts (generated)
│   ├── components/ RecordsTable, SummaryCard, SequenceViewer, BaseCompositionCard, BaseBadge, GCPlot,
│   │               PredictionChart, OrfMap, ChartCard
│   ├── pages/     UploadPage, ResultsPage
│   └── bases.ts   shared base colours
├── docker-compose.yml, backend/Dockerfile, frontend/Dockerfile, frontend/nginx.conf
├── .github/workflows/ci.yml
└── README.md
```

## 7. Phases — status
1. **Setup** ✅ — git repo, uv project (Python 3.11), Vite + React + Ant Design, ruff, CI.
2. **Data** ✅
   - BERTax "non-similar" dataset from OSF (DOI 10.17605/OSF.IO/QG6MV): test genera absent from train.
   - `train.fa`: first 600 MB streamed (~396k fragments; records are shuffled); `test.fa`: all 53,400 fragments.
   - Labels from NCBI taxid via `taxopy`; balanced to 25k/class (train, 5,185 taxa) and 5k/class (test, 197 taxa);
     no taxid shared; saved as Parquet.
   - *Changed:* DeepMicroClass external test set dropped (BERTax split already tests unseen genera).
3. **Features** ✅ — 256 ACGT 4-mers → L1 frequencies → dense → `StandardScaler`, all inside the `Pipeline`.
4. **Model** ✅ — LR 0.751 / RF 0.774 / **HistGradientBoosting 0.821** (CV macro F1, grouped by taxid);
   test macro F1 **0.80** on unseen genera; model card written.
5. **Backend** ✅ — `POST /api/analyze` (5 MB cap, IUPAC validation), `GET /api/health`; per record: sequence,
   length, base counts, GC, sliding-window GC (default 150 bp), ORFs + coding density, prediction
   (1,500 bp windows, averaged; ≥ 1,000 bp).
6. **Frontend** ✅ — upload/paste/"Try an example"; results page:
   - records table (sortable, origin filter; click a row to select)
   - Summary (id, description, length, GC, prediction) | Sequence viewer (colour-coded tiles, up to 50/row)
   - Base composition (donut + A/T/G/C/N counts, AT vs GC) | Sliding-window GC (window input + zoom slider)
   - Prediction probabilities | Six-frame ORF map (+ ORF count, longest ORF, coding density)
   - *Changed:* k-mer chart replaced by the ORF map; dropdown replaced by the table.
7. **Testing** ✅ — 12 pytest tests (validation, GC windows incl. averaging regression, ORFs on both strands,
   example predictions); CI runs ruff + pytest + ESLint + build.
8. **Packaging** ✅ — README, model card, Docker Compose files. ⚠️ Docker not tested locally (not installed).

## 8. Risks / known limitations
| Item | Status |
|---|---|
| Data leakage | Mitigated: BERTax unseen-genera split, `GroupKFold` by taxid |
| Archaea test set only 4 taxa | Open — its score is noisy |
| Short sequences | < 1,000 bp: no prediction, warning shown |
| Sliding-window GC counts `N` as non-GC | Open (overall GC ignores `N`) |
| No reverse-complement (canonical) k-mers | Open — prediction may differ slightly per strand |
| ORFs ≠ genes (introns, alternative starts) | Documented; example sequences are 4 joined fragments |
| Docker setup | Untested |

## 9. Ideas not yet done
- Per-window origin track along the sequence (prophage / chimeric-contig detection)
- GC skew plot for whole bacterial genomes
- ORF table with translated protein + copy for BLASTp
- Canonical k-mers; try k = 3 / 5; use more of the 3.4 GB training file
