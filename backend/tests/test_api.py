from pathlib import Path

import pytest
from app.analysis import MAX_GC_POINTS, gc_windows
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
    assert [p.position for p in points] == [2, 3, 4, 5, 6]  # window centres (bases 1-4 → 2), 1-based


def test_gc_windows_long_sequence_averages_instead_of_skipping():
    # 100 kb of A with a 20 bp G spike placed between the points that plain every-n-th sampling
    # would keep; averaging blocks of windows must still show it
    seq = "A" * 50_020 + "G" * 20 + "A" * 49_960
    points = gc_windows(seq, window=10)
    assert len(points) <= MAX_GC_POINTS
    assert max(p.gc for p in points) > 0  # the narrow spike is still visible, not skipped
    assert points[0].position < 100 and points[-1].position > 99_900  # whole sequence covered


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
    record = post(">short\nggcc\nAATT\n").json()["records"][0]
    assert record["sequence"] == "GGCCAATT"  # wrapped lines joined, uppercased
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
