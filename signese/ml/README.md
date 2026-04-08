# ML Workspace Layout

This folder contains ML-related scripts and documentation that should stay in git.

## In Git

- `ml/scripts/` — training, preprocessing, and export scripts
- `src/features/translate/model/dataset.manifest.json` — single source of truth for v0 labels
- lightweight docs and config files

## Out of Git

- downloaded raw datasets → `data/raw/`
- processed subsets, coverage reports, feature exports → `data/processed/`
- trained model artifacts (`*.pt`, `*.onnx`, `*.tflite`, etc.)

## Data Paths

| Path | Contents |
|--- |--- |
| `data/raw/` | Downloaded source datasets (ASL Citizen, WLASL, custom recordings) |
| `data/processed/` | Generated subsets, coverage/target JSON, feature tensors |
| `data/processed/models/` | Locally trained checkpoints — **ignored by git** |

## Scripts

### `ml/scripts/build_dataset_subset.py`

Reads `dataset.manifest.json` and produces a coverage report and flat target-label list.

```
# run from signese/ root
python ml/scripts/build_dataset_subset.py
```

Outputs written to `data/processed/`:
- `coverage_report.json` — per-status/source label breakdown
- `target_labels.json`   — flat list of included labels for dataset matching

Optional flag:
```
python ml/scripts/build_dataset_subset.py --manifest path/to/other.manifest.json
```

## Next Steps

1. Download ASL Citizen and/or WLASL into `data/raw/`.
2. Add a matching script (`ml/scripts/match_asl_citizen.py`) that fills `clip_count` and `verified` fields in `target_labels.json`.
3. Add a split-export script that writes `data/processed/splits/train.json`, `val.json`, `test.json`.
4. Train first isolated-sign model and save artifacts to `data/processed/models/`.
