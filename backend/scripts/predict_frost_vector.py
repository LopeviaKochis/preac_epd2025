# ...existing code...
import sys, json, joblib, numpy as np, os
from pathlib import Path

MODEL_PATH = os.getenv("FROST_MODEL_PATH", "case_models/GradientBoosting_final_optuna.joblib")
_model = None

def load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model

def main():
    """
    Espera en argv[1] un JSON:
    {
      "vector": [ ... 12 floats ... ],
      "threshold": 0.9
    }
    """
    raw = sys.argv[1]
    payload = json.loads(raw)
    vec = payload["vector"]
    threshold = payload.get("threshold", 0.9)
    model = load_model()

    X = np.array([vec], dtype=float)
    if hasattr(model, "predict_proba"):
        prob = float(model.predict_proba(X)[0][1])
    else:
        # fallback si modelo sólo da salida binaria
        out = model.predict(X)[0]
        prob = float(out) if isinstance(out, (int, float)) else float(out)

    risk_level = "alto" if prob >= threshold else ("medio" if prob >= 0.5 else "bajo")

    print(json.dumps({
        "risk": prob,
        "risk_level": risk_level,
        "threshold": threshold
    }))

if __name__ == "__main__":
    main()
# ...existing code...