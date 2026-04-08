# Translate MVP Sign Pipeline

This module implements the first constrained isolated-sign recognition scaffold for Signese.

## Scope

- Isolated sign classification only (not sentence-level translation)
- Starter vocabulary:
  - Alphabet A-Z
  - Numbers 1-20
  - Greeting/introduction signs (HELLO, GOOD-MORNING, GOOD-NIGHT, WELCOME, NICE, MEET, YOU, HOW, NAME, MY)
- Caption output appends gloss-like tokens in sequence
- Ambiguous outputs can emit `label1/label2`

## Runtime Pipeline

1. Camera preview runs through Expo Camera in the Translate screen.
2. Short temporal clips are sampled from live frames (mocked in this milestone).
3. Preprocessor converts clips into normalized model input.
4. Inference adapter predicts label probabilities.
5. Postprocessor applies:
   - EMA smoothing
   - confidence threshold
   - duplicate cooldown suppression
   - top-2 ambiguity fallback
6. UI appends accepted tokens to the captions buffer.

## Adapter Strategy

- `MockInferenceAdapter`: active for MVP flow testing
- `LocalModelInferenceAdapter`: TODO placeholder for on-device model execution
- `BackendInferenceAdapter`: TODO placeholder for server inference

## Dataset Strategy

- Single source of truth manifest in `model/dataset.manifest.json`
- Manifest-derived helpers in `model/manifest.ts` and `model/supportedSigns.ts`
- Training-export helpers in `model/preprocess.ts`
