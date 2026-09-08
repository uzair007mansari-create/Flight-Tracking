import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { aiService } from "@/services/ai.service";

interface Prediction {
  flight_number: string;
  from_airport: string;
  to_airport: string;
  predicted_delay_minutes: number;
  predicted_arrival?: string;
  scheduled_arrival?: string;
  status: string;
  model: string;
}

export default function DelayPredictionPage() {
  const { flightNumber } = useParams();

  const [prediction, setPrediction] =
    useState<Prediction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPrediction = async () => {
    if (!flightNumber) {
      setError("No flight selected.");
      setLoading(false);
      return;
    }

    try {
      const response =
        await aiService.getFlightDelayPrediction(
          flightNumber
        );

      setPrediction(response);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to obtain delay prediction.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();

    const interval = setInterval(() => {
      loadPrediction();
    }, 60000);

    return () => clearInterval(interval);
  }, [flightNumber]);

  if (loading) {
    return (
      <div className="p-6">
        Loading delay prediction...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          AI Delay Prediction
        </h1>

        <p className="mt-4 text-red-500">
          {error}
        </p>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          AI Delay Prediction
        </h1>

        <p className="text-muted-foreground">
          Live Random Forest arrival-delay prediction
        </p>
      </div>

      <div className="rounded-xl border p-6 space-y-5">

        <div>
          <p className="text-sm text-muted-foreground">
            Flight
          </p>

          <p className="text-2xl font-semibold">
            {prediction.flight_number}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Route
          </p>

          <p className="text-xl font-semibold">
            {prediction.from_airport}
            {" → "}
            {prediction.to_airport}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Predicted Arrival Delay
          </p>

          <p className="text-4xl font-bold">
            {prediction.predicted_delay_minutes.toFixed(1)}
            {" min"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Predicted Status
          </p>

          <p className="text-xl font-semibold">
            {prediction.status}
          </p>
        </div>

        {prediction.scheduled_arrival && (
          <div>
            <p className="text-sm text-muted-foreground">
              Scheduled Arrival
            </p>

            <p>
              {prediction.scheduled_arrival}
            </p>
          </div>
        )}

        {prediction.predicted_arrival && (
          <div>
            <p className="text-sm text-muted-foreground">
              Predicted Arrival
            </p>

            <p>
              {prediction.predicted_arrival}
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Prediction updates automatically every 60 seconds.
          </p>
        </div>

      </div>
    </div>
  );
}