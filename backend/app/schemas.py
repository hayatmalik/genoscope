from pydantic import BaseModel


class GCPoint(BaseModel):
    position: int
    gc: float


class Prediction(BaseModel):
    label: str
    probabilities: dict[str, float]
    windows: int


class ORF(BaseModel):
    start: int  # 1-based, first base of the ATG (lowest coordinate for reverse-strand ORFs)
    end: int  # 1-based, inclusive, includes the stop codon
    frame: int  # +1, +2, +3 (forward strand) or -1, -2, -3 (reverse strand)


class RecordResult(BaseModel):
    id: str
    description: str
    sequence: str
    length: int
    gc_content: float
    base_counts: dict[str, int]
    gc_windows: list[GCPoint]
    orfs: list[ORF]
    coding_density: float
    prediction: Prediction | None
    warning: str | None = None


class AnalyzeResponse(BaseModel):
    records: list[RecordResult]
