# Random Forest delay integration

The trained Random Forest from `flight-tracking-delay-prediction` is integrated into the Python AI service.

- AI endpoint: `POST /api/ai/delay/predict`
- Spring endpoint: `POST /api/ai/delay/predict`
- Frontend page: `/delay-prediction`
- Model artifacts: `ai-service/app/model/`

The prediction is **airport-month average arrival delay**, not an individual aircraft ETA.

Run the AI service, Spring backend, and Vite frontend as described in their existing READMEs. The AI service key configuration must match between Spring and the AI service.
