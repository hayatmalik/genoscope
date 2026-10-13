from pydantic import BaseModel


class GCPoint(BaseModel):
    position: int
    gc: float


class Prediction(BaseModel):
    label: str
    probabilities: dict[str, float]
    windows: int


class RecordResult(BaseModel):
    id: str
    description: str
    length: int
    gc_content: float
    base_counts: dict[str, int]
    gc_windows: list[GCPoint]
    kmer_profile: dict[str, float]
    prediction: Prediction | None
    warning: str | None = None


class AnalyzeResponse(BaseModel):
    records: list[RecordResult]
