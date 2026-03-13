# Hybrid ML Attack Classification Pipeline

This service integrates binary and multiclass ML models to classify network traffic as being either benign or as a specific type of attack.

## Requirements

- Python 3.10+
- Pandas
- Joblib
- Scikit-learn
- FastAPI
- Uvicorn
- Pydantic

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `mlmodel` | Directory containing the `.pkl` model files. | `./mlmodel` |
| `SAMPLES_PATH` | Full path to the `extraSamples.json` configuration file. | `./config/extraSamples.json` |

## Model Files Expected in `mlmodel` directory:

1. `binaryClassifier.pkl`: Used for Benign vs Attack classification.
2. `96percent.pkl`: Used for multiclass classification when binary classification detects an attack.

## API Endpoints

### `POST /test`

Accepts a single traffic feature object or an array of objects.

**Feature Schema:**
- `dstPort` (int)
- `flowDuration` (float)
- ... (and all other 25+ fields shown in the sample)

**Returns:**
```json
{
  "results": [
    {"class": "Benign", "attackType": null},
    {"class": "Attack", "attackType": "DDoS"},
    ...
  ]
}
```

## Running the service

```bash
uvicorn mlmodel.app:app --host 0.0.0.0 --port 8000
```

## Running Tests

```bash
pytest --cov=mlmodel mlmodel/tests/
```
