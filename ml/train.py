"""Train and select a k-mer superkingdom classifier; evaluate on the unseen-genera test set."""

import json
from itertools import product
from operator import methodcaller
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import ConfusionMatrixDisplay, classification_report
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, Normalizer, StandardScaler

DATA = Path(__file__).parent / "data"
OUT = Path(__file__).parent / "models"
K = 4
SEED = 42

pipeline = Pipeline(
    [
        (
            "kmers",
            CountVectorizer(
                analyzer="char",
                ngram_range=(K, K),
                lowercase=False,
                vocabulary=["".join(p) for p in product("ACGT", repeat=K)],
            ),
        ),
        ("freq", Normalizer(norm="l1")),
        ("dense", FunctionTransformer(methodcaller("toarray"), accept_sparse=True)),
        ("scale", StandardScaler()),
        ("clf", LogisticRegression()),
    ]
)
candidates = [
    {"clf": [LogisticRegression(max_iter=2000, class_weight="balanced")]},
    {"clf": [RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=SEED)]},
    {"clf": [HistGradientBoostingClassifier(class_weight="balanced", random_state=SEED)]},
]


def main() -> None:
    OUT.mkdir(exist_ok=True)
    train, test = (pd.read_parquet(DATA / f"{s}.parquet") for s in ("train", "test"))

    search = GridSearchCV(pipeline, candidates, scoring="f1_macro", cv=GroupKFold(3), n_jobs=-1, verbose=1)
    search.fit(train.sequence, train.label, groups=train.taxid)

    pred = search.predict(test.sequence)
    report = classification_report(test.label, pred, output_dict=True)
    print(classification_report(test.label, pred))

    joblib.dump(search.best_estimator_, OUT / "classifier.joblib", compress=3)
    ConfusionMatrixDisplay.from_predictions(test.label, pred, normalize="true", values_format=".2f", cmap="Blues")
    plt.savefig(OUT / "confusion_matrix.png", dpi=150, bbox_inches="tight")
    (OUT / "metrics.json").write_text(
        json.dumps(
            {
                "cv_macro_f1": {
                    type(p["clf"]).__name__: round(s, 4)
                    for p, s in zip(search.cv_results_["params"], search.cv_results_["mean_test_score"], strict=True)
                },
                "selected_model": type(search.best_estimator_["clf"]).__name__,
                "test": report,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
