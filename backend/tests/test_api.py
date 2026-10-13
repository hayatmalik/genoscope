from pathlib import Path

import pytest
from app.analysis import gc_windows
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
EXAMPLE = Path(__file__).parents[2] / "frontend/public/example.fasta"


def post(fasta: str, **params):
    return client.post("/api/analyze", files={"file": ("seq.fasta", fasta)}, params=params)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_gc_windows():
    points = gc_windows("GGGGAAAA", window=4)
    assert [p.gc for p in points] == [1.0, 0.75, 0.5, 0.25, 0.0]


@pytest.mark.parametrize(
    ("fasta", "status"),
    [
        ("", 422),
        ("not a fasta file", 422),
        (">empty\n", 422),
        (">bad\nACGTXZ\n", 422),
        (">ok\nacgtn\n", 200),
    ],
)
def test_validation(fasta, status):
    assert post(fasta).status_code == status


def test_too_large():
    assert post(">big\n" + "A" * 5_000_001).status_code == 413


def test_short_sequence_has_stats_but_no_prediction():
    record = post(">short\nGGCCAATT\n").json()["records"][0]
    assert record["length"] == 8
    assert record["gc_content"] == 0.5
    assert record["base_counts"] == {"G": 2, "C": 2, "A": 2, "T": 2}
    assert record["prediction"] is None
    assert record["warning"]


def test_example_file_predictions():
    records = post(EXAMPLE.read_text()).json()["records"]
    assert len(records) == 4
    for r in records:
        expected = r["id"].split("_")[0]
        assert r["prediction"]["label"] == expected
        assert sum(r["prediction"]["probabilities"].values()) == pytest.approx(1, abs=1e-3)
        assert len(r["kmer_profile"]) == 256
