import os
from collections import Counter
from functools import cache
from pathlib import Path

import joblib
import pandas as pd
from Bio.SeqRecord import SeqRecord
from Bio.SeqUtils import gc_fraction
from sklearn.pipeline import Pipeline

from .schemas import GCPoint, Prediction, RecordResult

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).parents[2] / "ml/models/classifier.joblib"))
FRAGMENT_LEN = 1500  # length of the training fragments
MIN_LEN = 1000
MAX_GC_POINTS = 1000


@cache
def model() -> Pipeline:
    return joblib.load(MODEL_PATH)


def gc_windows(seq: str, window: int) -> list[GCPoint]:
    gc = pd.Series(list(seq)).isin(["G", "C"]).rolling(window).mean().dropna()
    gc = gc.iloc[:: max(1, -(-len(gc) // MAX_GC_POINTS))]  # ceil division
    return [GCPoint(position=i - window // 2 + 1, gc=round(v, 4)) for i, v in gc.items()]


def predict(seq: str) -> Prediction | None:
    windows = [w for i in range(0, len(seq), FRAGMENT_LEN) if len(w := seq[i : i + FRAGMENT_LEN]) >= MIN_LEN]
    if not windows:
        return None
    probs = model().predict_proba(windows).mean(axis=0)
    classes = model().classes_
    return Prediction(
        label=classes[probs.argmax()],
        probabilities={c: round(float(p), 4) for c, p in zip(classes, probs, strict=True)},
        windows=len(windows),
    )


def kmer_profile(seq: str) -> dict[str, float]:
    kmers = model()[:2]  # CountVectorizer + L1 Normalizer from the trained pipeline
    freqs = kmers.transform([seq]).toarray()[0]
    return {k: round(float(f), 5) for k, f in zip(kmers[0].get_feature_names_out(), freqs, strict=True)}


def analyze_record(record: SeqRecord, window: int) -> RecordResult:
    seq = str(record.seq).upper()
    prediction = predict(seq)
    return RecordResult(
        id=record.id,
        description=record.description,
        sequence=seq,
        length=len(seq),
        gc_content=round(gc_fraction(seq, ambiguous="ignore"), 4),
        base_counts=dict(Counter(seq).most_common()),
        gc_windows=gc_windows(seq, min(window, len(seq))),
        kmer_profile=kmer_profile(seq),
        prediction=prediction,
        warning=None if prediction else f"Sequence shorter than {MIN_LEN} bp; no prediction made.",
    )
