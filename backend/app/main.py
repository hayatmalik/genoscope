from io import StringIO

from Bio import SeqIO
from Bio.Data.IUPACData import ambiguous_dna_letters
from fastapi import FastAPI, HTTPException, Query, UploadFile

from .analysis import analyze_record
from .schemas import AnalyzeResponse

MAX_BYTES = 5_000_000
VALID = set(ambiguous_dna_letters)

app = FastAPI(title="GenoScope API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(file: UploadFile, window: int = Query(150, ge=10, le=10_000)) -> AnalyzeResponse:
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(413, f"File larger than {MAX_BYTES // 1_000_000} MB.")
    try:
        records = list(SeqIO.parse(StringIO(content.decode(errors="replace")), "fasta"))
    except ValueError:
        records = []
    if not any(len(r) for r in records):
        raise HTTPException(422, "No FASTA records found.")
    for r in records:
        if invalid := set(str(r.seq).upper()) - VALID:
            raise HTTPException(422, f"Record '{r.id}' contains invalid characters: {''.join(sorted(invalid))}")
    return AnalyzeResponse(records=[analyze_record(r, window) for r in records if len(r)])
