from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/delay",
    tags=["delay-prediction"]
)

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "model"
    / "rf_delay_model.pkl"
)


class DelayPredictionRequest(BaseModel):
    from_airport: str
    to_airport: str
    airline: str

    year: int
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    day_of_week: int = Field(ge=0, le=6)

    sdep: float
    sarr: float

    departure_delay: float

    distance: float = Field(ge=0)
    passenger_load_factor: float
    airline_rating: float
    airport_rating: float
    market_share: float
    otp_index: float

    windspeed: float
    weather_description: str
    precipitation: float
    humidity: float
    visibility: float
    pressure: float
    cloudcover: float


class DelayPredictionResponse(BaseModel):
    predicted_delay_minutes: float
    status: str
    model: str
    target: str


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Random Forest model not found at {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)


@router.get("/info")
def delay_model_info():
    return {
        "model": "RandomForestRegressor",
        "target": "Arrival Delay",
        "type": "individual-flight delay prediction"
    }


@router.post(
    "/predict",
    response_model=DelayPredictionResponse
)
def predict_delay(request: DelayPredictionRequest):

    try:
        model = load_model()

        input_data = pd.DataFrame([
            {
                "From": request.from_airport.upper(),
                "To": request.to_airport.upper(),
                "Airline": request.airline,

                "Year": request.year,
                "Month": request.month,
                "Day": request.day,
                "DayOfWeek": request.day_of_week,

                "SDEP": request.sdep,
                "SARR": request.sarr,

                "Departure Delay": request.departure_delay,

                "Distance": request.distance,
                "Passenger Load Factor":
                    request.passenger_load_factor,
                "Airline Rating":
                    request.airline_rating,
                "Airport Rating":
                    request.airport_rating,
                "Market Share":
                    request.market_share,
                "OTP Index":
                    request.otp_index,

                "weather__hourly__windspeedKmph":
                    request.windspeed,

                "weather__hourly__weatherDesc__value":
                    request.weather_description,

                "weather__hourly__precipMM":
                    request.precipitation,

                "weather__hourly__humidity":
                    request.humidity,

                "weather__hourly__visibility":
                    request.visibility,

                "weather__hourly__pressure":
                    request.pressure,

                "weather__hourly__cloudcover":
                    request.cloudcover,
            }
        ])

        prediction = float(model.predict(input_data)[0])

        status = (
            "Delayed"
            if prediction >= 15
            else "On Time"
        )

        return DelayPredictionResponse(
            predicted_delay_minutes=round(
                prediction,
                2
            ),
            status=status,
            model="RandomForestRegressor",
            target="Arrival Delay"
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )