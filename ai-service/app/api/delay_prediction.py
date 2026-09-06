"""Airport-month delay prediction using the trained Random Forest export."""
from functools import lru_cache
from pathlib import Path
import json
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/delay", tags=["delay-prediction"])
MODEL_DIR = Path(__file__).resolve().parents[1] / "model"


class DelayPredictionRequest(BaseModel):
    year: int
    month: int = Field(ge=1, le=12)
    airport: str = Field(min_length=3, max_length=3)
    arr_flights: float = Field(ge=0)
    arr_del15: float = Field(ge=0)
    carrier_ct: float = Field(ge=0)
    weather_ct: float = Field(ge=0)
    nas_ct: float = Field(ge=0)
    late_aircraft_ct: float = Field(ge=0)
    arr_cancelled: float = Field(ge=0)
    arr_diverted: float = Field(ge=0)
    delay_rate: float = Field(ge=0)
    cancellation_rate: float = Field(ge=0)
    diversion_rate: float = Field(ge=0)
    operational_disruptions: float = Field(ge=0)
    congestion_index: float
    operational_efficiency: float
    relative_congestion: float
    previous_congestion: float
    congestion_trend: float


class DelayPredictionResponse(BaseModel):
    airport: str
    predicted_delay_minutes: float
    status: str
    model: str
    target: str


@lru_cache(maxsize=1)
def load_artifacts():
    with open(MODEL_DIR / "rf_delay_model.json", encoding="utf-8") as f:
        model = json.load(f)
    with open(MODEL_DIR / "encoders.json", encoding="utf-8") as f:
        encoders = json.load(f)
    with open(MODEL_DIR / "features.json", encoding="utf-8") as f:
        features = json.load(f)
    return model, encoders, features


def _tree_predict(tree: dict, row: list[float]) -> float:
    node = 0
    left = tree["children_left"]
    right = tree["children_right"]
    feature = tree["feature"]
    threshold = tree["threshold"]
    values = tree["value"]

    while left[node] != -1:
        idx = feature[node]
        node = left[node] if row[idx] <= threshold[node] else right[node]
    return float(values[node][0][0])


def _forest_predict(model: dict, row: list[float]) -> float:
    trees = model.get("estimators", [])
    if not trees:
        raise RuntimeError("Random Forest export contains no estimators")
    return sum(_tree_predict(tree, row) for tree in trees) / len(trees)


@router.get("/info")
def model_info():
    model, _, features = load_artifacts()
    return {
        "model": model.get("model_type", "RandomForestRegressor"),
        "target": features.get("target", model.get("target")),
        "n_estimators": model.get("n_estimators"),
        "n_features": model.get("n_features"),
        "metrics": features.get("metrics", {}),
    }


@router.post("/predict", response_model=DelayPredictionResponse)
def predict_delay(request: DelayPredictionRequest):
    model, encoders, metadata = load_artifacts()
    airport = request.airport.strip().upper()
    airport_map: Dict[str, int] = encoders.get("airport", {})
    if airport not in airport_map:
        raise HTTPException(
            status_code=400,
            detail=f"Airport {airport} was not present in the Random Forest training data",
        )

    raw = request.model_dump()
    raw["airport_enc"] = airport_map[airport]
    feature_names = metadata["features"]
    try:
        row = [float(raw[name]) for name in feature_names]
    except KeyError as exc:
        raise HTTPException(status_code=500, detail=f"Missing model feature: {exc.args[0]}")

    prediction = _forest_predict(model, row)
    return DelayPredictionResponse(
        airport=airport,
        predicted_delay_minutes=round(prediction, 2),
        status="Delayed" if prediction >= 15.0 else "On Time",
        model="RandomForestRegressor",
        target=metadata.get("target", "avg_arrival_delay_minutes"),
    )
