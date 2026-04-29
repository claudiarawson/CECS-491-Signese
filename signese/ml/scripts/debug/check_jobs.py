from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
JOBS_PATH = REPO_ROOT / "data" / "processed" / "landmarks" / "asl_citizen_train_jobs.json"


def main() -> None:
    with JOBS_PATH.open(encoding="utf-8-sig") as f:
        jobs = json.load(f)

    print("First 2 ASL Citizen training jobs:")
    for i, job in enumerate(jobs[:2]):
        print(f"{i}:")
        print(f"  sample_id: {job.get('sample_id')}")
        print(f"  label: {job.get('label')}")
        print(f"  output_path: {job.get('output_path')}")


if __name__ == "__main__":
    main()
