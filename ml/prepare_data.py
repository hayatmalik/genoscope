"""Label BERTax fragments with their superkingdom and write balanced train/test Parquet files."""

from pathlib import Path

import pandas as pd
import taxopy
from Bio import SeqIO

DATA = Path(__file__).parent / "data"
CLASSES = ["Archaea", "Bacteria", "Eukaryota", "Viruses"]
FRAGMENT_LEN = 1500
MAX_PER_CLASS = {"train": 25_000, "test": 5_000}
SEED = 42


def load_fasta(path: Path) -> pd.DataFrame:
    df = pd.DataFrame(
        ((int(r.id), str(r.seq).upper()) for r in SeqIO.parse(path, "fasta")),
        columns=["taxid", "sequence"],
    )
    return df[df.sequence.str.len() == FRAGMENT_LEN]  # drops the truncated last record of the streamed train.fa


def superkingdom(taxid: int, db: taxopy.TaxDb) -> str | None:
    try:
        return next((n for n in taxopy.Taxon(taxid, db).name_lineage if n in CLASSES), None)
    except taxopy.exceptions.TaxidError:
        return None


def write_example(test: pd.DataFrame, path: Path, fragments: int = 4) -> None:
    """One test-set sequence per class (concatenated fragments of a single taxon) for the UI's example button."""
    with open(path, "w") as f:
        for label, group in test.groupby("label"):
            taxid = group.taxid.value_counts().index[0]
            seq = "".join(group[group.taxid == taxid].sequence.head(fragments))
            f.write(f">{label}_{taxid} {label} example (NCBI taxid {taxid}, held-out test set)\n{seq}\n")


def main() -> None:
    tax = DATA / "taxdump"
    db = taxopy.TaxDb(
        nodes_dmp=str(tax / "nodes.dmp"), names_dmp=str(tax / "names.dmp"), merged_dmp=str(tax / "merged.dmp")
    )
    for split, n in MAX_PER_CLASS.items():
        df = load_fasta(DATA / "raw" / f"{split}.fa")
        labels = {t: superkingdom(t, db) for t in df.taxid.unique()}
        df = df.assign(label=df.taxid.map(labels)).dropna(subset=["label"])
        df = df.sample(frac=1, random_state=SEED).groupby("label").head(n).reset_index(drop=True)
        df.to_parquet(DATA / f"{split}.parquet")
        print(split, df.label.value_counts().to_dict(), f"{df.taxid.nunique()} taxa")
    write_example(df, Path(__file__).parents[1] / "frontend/public/example.fasta")


if __name__ == "__main__":
    main()
