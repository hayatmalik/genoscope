# GenoScope: Project Documentation

GenoScope is a web application for the analysis of DNA sequences. A user uploads a FASTA file and receives, for each
record in the file, descriptive statistics, a sliding-window GC profile, a six-frame map of open reading frames and a
machine-learning prediction of the sequence's superkingdom of origin (Archaea, Bacteria, Eukaryota or Viruses).

The application consists of a Python backend, which performs all analysis and prediction, and a React frontend, which
handles user input and visualises the results.

---

## 1. Backend

### 1.1 User Input and Validation
- **FastAPI** provides the REST API. The endpoint `POST /api/analyze` receives the FASTA file as a multipart upload
  (`UploadFile`), and `GET /api/health` reports service availability.
- **Biopython** (`Bio.SeqIO`) parses the uploaded file into individual sequence records, so both single-sequence
  files and multi-record files, such as genome assemblies with many contigs, are supported.
- The following validation checks are applied before analysis; failures are returned to the user as an HTTP error
  with a descriptive message:
  - files larger than 5 MB are rejected (HTTP 413)
  - files that are empty or contain no FASTA records are rejected (HTTP 422)
  - sequences with characters outside the IUPAC DNA alphabet (A, C, G, T and the ambiguity codes such as N, R
    and Y) are rejected (HTTP 422), and the response names the record and the invalid characters
- **Pydantic** models define the structure of the response, which FastAPI also publishes as an OpenAPI schema.
  The frontend's TypeScript types are generated from this schema.

### 1.2 Descriptive Sequence Analysis
- For every record, the sequence length and the count of each base (A, C, G, T, N and other ambiguity codes) are
  calculated with Python's `collections.Counter`.
- The overall GC content is calculated with Biopython's `gc_fraction`. Ambiguous bases are excluded from the
  calculation so that they do not bias the result.
- These values give a first characterisation of the sequence. GC content in particular varies strongly between
  organisms and is a basic quality and identity check in genomics.

### 1.3 Sliding-Window GC Content
- **pandas** (`Series.rolling().mean()`) calculates the GC fraction within a window that moves along the sequence
  one base at a time. Each value is placed at the centre of its window.
- The window size defaults to 150 bp and can be set by the user between 10 and 10,000 bp. Smaller windows show
  local detail; larger windows show broad trends.
- For long sequences, consecutive windows are averaged in blocks so that at most 1,000 points are sent to the
  browser. Because every window contributes to a block, short GC peaks and dips remain visible after reduction.

### 1.4 Open Reading Frame (ORF) Analysis
- **orfipy** searches all six reading frames (three on each DNA strand) for open reading frames. An ORF is a
  stretch that begins with the start codon ATG and ends at the next in-frame stop codon (TAA, TAG or TGA).
- Only ORFs of at least 300 bp (100 codons) are reported, because shorter ORFs occur frequently by chance. For each
  ORF, the 1-based start and end positions and the reading frame (+1 to +3, −1 to −3) are returned.
- **NumPy** computes the coding density: the fraction of the sequence covered by at least one ORF. Overlapping ORFs
  are counted only once.

### 1.5 Data Collection and Preparation for Machine Learning
- The training data is the BERTax "non-similar" dataset (Mock et al., *PNAS* 2022, published on OSF). It consists
  of 1,500 bp DNA fragments from NCBI RefSeq genomes, each labelled with an NCBI taxonomy ID, and was designed so that
  test genera do not appear in the training set.
- **remotezip** extracts files directly from the remote archive using HTTP range requests, so the full archive does
  not need to be downloaded. The complete test file and the first 600 MB of the 3.4 GB training file are retrieved.
  The training records are stored in random order, so the first 600 MB form a representative sample. **requests**
  downloads the NCBI taxonomy dump.
- **taxopy** maps each taxonomy ID to its superkingdom using the NCBI taxonomy dump. The data is then balanced per
  class with **pandas** and stored as Parquet files (**pyarrow**):
  - **Training set:** 100,000 fragments (25,000 per class) from 5,185 taxa
  - **Test set:** 20,000 fragments (5,000 per class) from 197 taxa, sharing no taxon with the training set
- The same script writes an example FASTA file containing one held-out test sequence per superkingdom, used by the
  frontend's "Try an example" option.

### 1.6 Feature Engineering
- Each fragment is represented by the frequencies of all 256 possible 4-mers (every combination of four bases, from
  AAAA to TTTT). This tetranucleotide profile is a well-established genomic signature that differs between lineages.
- **scikit-learn**'s `CountVectorizer` counts the 4-mers using a fixed vocabulary, `Normalizer` converts the counts
  to frequencies, and `StandardScaler` scales each feature to zero mean and unit variance.
- All feature steps and the classifier are combined in a single scikit-learn `Pipeline`. The training script and the
  live API therefore compute features in exactly the same way.

### 1.7 Model Training and Selection
- Three classifiers from **scikit-learn** were compared, each with balanced class weights:
  - logistic regression, a linear baseline
  - random forest with 300 trees
  - histogram-based gradient boosting (`HistGradientBoostingClassifier`)
- `GridSearchCV` evaluated each classifier with three-fold cross-validation, scored by macro-averaged F1. The folds
  were created with `GroupKFold`, grouped by taxonomy ID, so fragments from the same organism never appear in both
  the training and validation folds.
- The best-performing model, gradient boosting, was retrained on the full training set and saved with **joblib**
  (under 1 MB). The API loads it once at the first request.

### 1.8 Prediction
- Each uploaded sequence is divided into non-overlapping 1,500 bp windows, matching the training fragment length.
  A final window shorter than 1,000 bp is discarded.
- The model predicts class probabilities for every window. These are averaged into a single prediction per record,
  reported together with the number of windows used.
- Sequences shorter than 1,000 bp receive all descriptive analyses but no prediction, and a warning is returned
  instead.

### 1.9 Results
- Cross-validated macro F1 scores on the training set:

  | Classifier | CV macro F1 |
  |---|---|
  | Logistic regression | 0.751 |
  | Random forest | 0.774 |
  | **Histogram gradient boosting (selected)** | **0.821** |

- On the held-out test set of genera unseen during training, the selected model reached a **macro F1 score of 0.80**
  per 1,500 bp fragment:

  | Class | Precision | Recall | F1 |
  |---|---|---|---|
  | Archaea | 0.79 | 0.91 | 0.85 |
  | Bacteria | 0.80 | 0.78 | 0.79 |
  | Eukaryota | 0.83 | 0.74 | 0.78 |
  | Viruses | 0.78 | 0.76 | 0.77 |

- The full evaluation, including the confusion matrix (plotted with scikit-learn's `ConfusionMatrixDisplay` and
  **matplotlib**), is documented in [ml/MODEL_CARD.md](ml/MODEL_CARD.md).

### 1.10 Testing and Code Quality
- **pytest** with FastAPI's `TestClient` (**httpx**) runs 12 automated tests covering:
  - input validation and the file-size limit
  - the positions and block averaging of the sliding-window GC calculation
  - ORF detection on both DNA strands
  - predictions on the example sequences
- **Ruff** enforces linting and consistent formatting of all Python code.
- **uv** manages the Python 3.11 environment and dependencies, with separate dependency groups for development
  tools and for the machine-learning pipeline.

---

## 2. Frontend

### 2.1 Framework and Tooling
- The user interface is written in **React 19** with **TypeScript**, which adds static type checking to JavaScript.
- **Vite** serves the application during development and builds the optimised production bundle. In development,
  it forwards all `/api` requests to the backend.
- **Ant Design 6** provides the UI components (cards, tables, upload areas, statistics and tags), so no basic
  interface elements were built from scratch.

### 2.2 Communication with the Backend
- **axios** sends the FASTA file to the backend as a multipart form, together with the selected GC window size.
- **TanStack Query** manages the request state: it provides the loading, error and success states used to show a
  loading spinner, an error banner with the backend's message, or the results.
- **openapi-typescript** generates TypeScript types from the backend's OpenAPI schema, so the data structures used
  by the frontend always match the API.

### 2.3 Upload Page
- The upload page offers three input methods:
  - drag-and-drop or file selection, using Ant Design's `Upload.Dragger`
  - pasting a sequence into a text field (a FASTA header is added automatically if missing)
  - a "Try an example" button that loads one held-out test sequence per superkingdom
- The file picker is restricted to FASTA file types (`.fa`, `.fasta`, `.fna`, `.txt`), and the 5 MB limit is
  shown to the user before upload.

### 2.4 Results Page and Records Table
- A table built with Ant Design's `Table` lists every record of the uploaded file, with ID, length, GC content and
  predicted origin. The table can be sorted by any column and filtered by predicted origin.
- Selecting a record in the table updates all analysis cards below it. A "New analysis" button returns to the upload
  page, and "Export JSON" downloads the complete results.
- The cards are arranged with Ant Design's responsive grid (`Row` and `Col`). They appear side by side on wide
  screens and stack vertically on smaller screens.

### 2.5 Visualisation Components
- Each analysis is presented in its own card. Charts are drawn with **@ant-design/plots**, a React charting library
  based on the G2 visualisation engine:
  - **Summary:** record ID and description, length, GC content and predicted origin with its confidence, shown
    with Ant Design's `Descriptions` and `Statistic` components
  - **Sequence viewer:** the full sequence as colour-coded bases with position labels, rendered with a virtual list
    (`@rc-component/virtual-list`) so that only visible rows are drawn and multi-megabase sequences scroll smoothly.
    The number of bases per row adapts to the card width (`@rc-component/resize-observer`).
  - **Base composition:** a donut chart of A, T, G, C and N with the count and percentage of each base, plus the
    overall AT and GC proportions
  - **Sliding-window GC content:** a line chart with a zoom slider and an input field for the window size, which
    re-runs the analysis on the backend
  - **Origin prediction:** a bar chart of the four class probabilities
  - **Open reading frames:** a six-frame map in which every ORF is drawn as a bar at its position, coloured by
    strand, with the ORF count, the longest ORF and the coding density shown above it

### 2.6 Theme and Design
- A single Ant Design theme (`ConfigProvider`) defines the colour scheme for the entire application: a purple
  primary colour, a cyan secondary colour and a deep indigo for card headers and labels.
- Colours for the four bases and the four prediction classes are defined once and shared by all components, so the
  same base or class always appears in the same colour.
- Reusable components (a common chart card, base colour badges and value tags) keep the presentation consistent and
  avoid duplicated code.

### 2.7 Code Quality
- **ESLint** checks the TypeScript and React code for errors and common mistakes.
- The production build runs the TypeScript compiler first, so type errors stop the build.

---

## 3. Deployment and Continuous Integration
- **Docker Compose** defines two services: the FastAPI backend, and the frontend served by **nginx**, which also
  forwards API requests to the backend. The application is then available on a single port.
- **GitHub Actions** runs on every push and pull request. The backend job runs Ruff and pytest; the frontend job runs
  ESLint and the production build.
