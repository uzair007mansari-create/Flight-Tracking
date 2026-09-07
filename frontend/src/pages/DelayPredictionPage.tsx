import { useState, type SubmitEvent } from "react";
import { BrainCircuit, AlertCircle } from "lucide-react";
import { aiService, type DelayPredictionRequest, type DelayPredictionResponse } from "@/services/ai.service";
import { ApiError } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initial: DelayPredictionRequest = {
  year: 2026, month: 1, airport: "ATL", arr_flights: 7800, arr_del15: 1650,
  carrier_ct: 420, weather_ct: 95, nas_ct: 510, late_aircraft_ct: 530,
  arr_cancelled: 120, arr_diverted: 18, delay_rate: 0.2115,
  cancellation_rate: 0.0154, diversion_rate: 0.0023, operational_disruptions: 138,
  congestion_index: 0.72, operational_efficiency: 0.79, relative_congestion: 1.18,
  previous_congestion: 0.68, congestion_trend: 0.04,
};

const fields: Array<[keyof DelayPredictionRequest, string]> = [
  ["year","Year"],["month","Month"],["airport","Airport (IATA)"],["arr_flights","Arriving flights"],
  ["arr_del15","Arrivals delayed 15+ min"],["carrier_ct","Carrier count"],["weather_ct","Weather count"],
  ["nas_ct","NAS count"],["late_aircraft_ct","Late-aircraft count"],["arr_cancelled","Cancelled arrivals"],
  ["arr_diverted","Diverted arrivals"],["delay_rate","Delay rate"],["cancellation_rate","Cancellation rate"],
  ["diversion_rate","Diversion rate"],["operational_disruptions","Operational disruptions"],
  ["congestion_index","Congestion index"],["operational_efficiency","Operational efficiency"],
  ["relative_congestion","Relative congestion"],["previous_congestion","Previous congestion"],
  ["congestion_trend","Congestion trend"],
];

export function DelayPredictionPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<DelayPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(null); setResult(null);
    try { setResult(await aiService.predictDelay(form)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Prediction failed."); }
    finally { setLoading(false); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold flex items-center gap-2"><BrainCircuit className="size-6 text-primary"/>Delay Prediction</h1>
      <p className="text-sm text-muted-foreground">Random Forest estimate of airport-month average arrival delay.</p></div>
    <Card><CardHeader><CardTitle>Model inputs</CardTitle><CardDescription>Enter aggregate airport/month statistics. This is not a per-flight ETA prediction.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map(([key,label]) => <div key={key} className="space-y-1.5"><Label htmlFor={key}>{label}</Label><Input id={key}
          value={form[key]} type={key === "airport" ? "text" : "number"} step="any"
          onChange={(e) => setForm({...form, [key]: key === "airport" ? e.target.value.toUpperCase() : Number(e.target.value)})}/></div>)}
      </div><Button disabled={loading}>{loading ? "Predicting..." : "Predict delay"}</Button></form></CardContent></Card>
    {error && <Alert variant="destructive"><AlertCircle className="size-4"/><AlertTitle>Prediction error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    {result && <Card><CardHeader><CardTitle className="flex items-center gap-2">{result.airport} prediction <Badge variant={result.status === "Delayed" ? "destructive" : "secondary"}>{result.status}</Badge></CardTitle></CardHeader>
      <CardContent><div className="text-4xl font-semibold">{result.predicted_delay_minutes.toFixed(2)} <span className="text-base font-normal text-muted-foreground">minutes</span></div>
        <p className="mt-2 text-xs text-muted-foreground">{result.model} • target: {result.target}</p></CardContent></Card>}
  </div>;
}
