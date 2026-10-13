"""Download the BERTax "non-similar" dataset (test genera unseen in train) and the NCBI taxonomy.

BERTax: Mock et al., PNAS 2022, https://osf.io/qg6mv/
train.fa is 3.4 GB, but records are shuffled, so only its first TRAIN_BYTES are streamed.
"""

import tarfile
from pathlib import Path

import requests
from remotezip import RemoteZip

DATA = Path(__file__).parent / "data"
RAW, TAXDUMP = DATA / "raw", DATA / "taxdump"
BERTAX_ZIP = "https://osf.io/download/shcmd/"  # non_similar_dataset.zip
TAXDUMP_URL = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz"
TRAIN_BYTES = 240_000_000  # ~158k fragments; the size the shipped model was trained on
CHUNK = 8_000_000


def download_bertax() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    with RemoteZip(BERTAX_ZIP) as z:
        if not (RAW / "test.fa").exists():
            z.extract("test.fa", RAW)
        if not (RAW / "train.fa").exists():
            with z.open("train.fa") as src, open(RAW / "train.fa", "wb") as dst:
                while dst.tell() < TRAIN_BYTES:
                    dst.write(src.read(CHUNK))


def download_taxonomy() -> None:
    if (TAXDUMP / "nodes.dmp").exists():
        return
    TAXDUMP.mkdir(parents=True, exist_ok=True)
    archive = TAXDUMP / "taxdump.tar.gz"
    with requests.get(TAXDUMP_URL, stream=True, timeout=60) as r, open(archive, "wb") as f:
        r.raise_for_status()
        for block in r.iter_content(CHUNK):
            f.write(block)
    with tarfile.open(archive) as tar:
        tar.extractall(TAXDUMP, members=[tar.getmember(n) for n in ("nodes.dmp", "names.dmp", "merged.dmp")])


if __name__ == "__main__":
    download_taxonomy()
    download_bertax()
