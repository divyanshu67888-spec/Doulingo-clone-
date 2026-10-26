# LinguaQuest Difficulty Recommendation Service (ML Demo)

A lightweight FastAPI microservice hosting a scikit-learn Pipeline (OneHotEncoder + RandomForestClassifier) that suggests quiz difficulty (`Easy`, `Medium`, `Hard`) based on learner metrics.

> **Note:** This model is trained **strictly on synthetic data** for demo/educational purposes. It does not represent real learner behavior.

---

## 1. Setup Virtual Environment & Install Dependencies

From the project root:

### Windows (PowerShell / CMD)
```powershell
python -m venv ml_service\.venv
ml_service\.venv\Scripts\pip install -r ml_service\requirements.txt
```

### macOS / Linux
```bash
python3 -m venv ml_service/.venv
source ml_service/.venv/bin/activate
pip install -r ml_service/requirements.txt
```

---

## 2. Train / Export the Synthetic Model
If `difficulty_model.joblib` is not already generated:

```bash
python ml_service/train_model.py
```
*(Uses `ml_service/.venv/Scripts/python.exe` on Windows)*

---

## 3. Run the Microservice

```bash
uvicorn ml_service.app:app --port 8000
```
Or directly from the venv:
```powershell
ml_service\.venv\Scripts\uvicorn.exe ml_service.app:app --port 8000
```

The API will be available at:
- **Service URL:** `http://localhost:8000`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## 4. Test with cURL

### Health check
```bash
curl http://localhost:8000/health
```

### Recommendation prediction
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"accuracy\": 0.75, \"avg_response_time_sec\": 10.5, \"previous_attempts\": 3, \"topic\": \"Greetings\"}"
```

Example response:
```json
{
  "recommended_difficulty": "Medium",
  "probabilities": {
    "Easy": 0.18,
    "Medium": 0.62,
    "Hard": 0.20
  },
  "synthetic_model": true
}
```
