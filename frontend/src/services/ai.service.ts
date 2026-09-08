import { Api } from "./api";

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  answer: string;
  model: string;
  requestId: string;
  conversationId?: string;
}

export interface RecommendationRequest {
  query: string;
}

export interface RecommendationFlightInfo {
  flight_number?: string | null;
  origin?: string | null;
  destination?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  airline?: string | null;
  status?: string | null;
  aircraft?: string | null;
}

export interface RecommendationScoredFlight {
  flight: RecommendationFlightInfo;
  score: number;
  score_breakdown: Record<string, unknown>;
  weather_available: boolean;
  prediction_available: boolean;
}

export interface RecommendationResponse {
  recommended_flight: RecommendationScoredFlight | null;
  alternatives: RecommendationScoredFlight[];
  explanation: string;
  limitations: string[];
  total_flights_evaluated: number;
  requestId: string;
}



export interface DelayPredictionRequest {
  from_airport: string;
  to_airport: string;
  airline: string;

  year: number;
  month: number;
  day: number;
  day_of_week: number;

  sdep: number;
  sarr: number;

  departure_delay: number;

  distance: number;
  passenger_load_factor: number;
  airline_rating: number;
  airport_rating: number;
  market_share: number;
  otp_index: number;

  windspeed: number;
  weather_description: string;
  precipitation: number;
  humidity: number;
  visibility: number;
  pressure: number;
  cloudcover: number;
}

export interface DelayPredictionResponse {
  predicted_delay_minutes: number;
  status: "Delayed" | "On Time";
  model: string;
  target: string;
}

export interface FlightDelayPrediction {
  flight_number: string;
  from_airport: string;
  to_airport: string;
  predicted_delay_minutes: number;
  scheduled_arrival?: string;
  predicted_arrival?: string;
  status: string;
  model: string;
}

// Keep your EXISTING interfaces for chat/recommend here.
// Do not delete them.

export const aiService = {
  // KEEP YOUR EXISTING chat FUNCTION
  chat: async (request: any) => {
    return Api.post("/api/ai/chat", request);
  },

  // KEEP YOUR EXISTING recommend FUNCTION
  recommend: async (request: any) => {
    return Api.post("/api/ai/recommend", request);
  },

  // ADD this new function
  getFlightDelayPrediction: (
    flightNumber: string
  ): Promise<FlightDelayPrediction> =>
    Api.get<FlightDelayPrediction>(
      `/api/ai/delay/flight/${encodeURIComponent(flightNumber)}`
    ),
};