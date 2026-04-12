import { API } from "../../types";
import { Cache, Coordinates, Data } from "./types";

type Config = Pick<Data, "latitude" | "longitude" | "units">;

/** Get current forecast for a location */
export async function getForecast(
  { latitude, longitude, units }: Config,
  loader: API["loader"],
): Promise<Cache> {
  if (!latitude || !longitude) {
    return;
  }

  loader.push();
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    "hourly=temperature_2m&" +
    "hourly=apparent_temperature&" +
    "hourly=relativehumidity_2m&" +
    "hourly=weathercode&" +
    "timeformat=unixtime&" +
    `temperature_unit=${units === "us" ? "fahrenheit" : "celsius"}`;
  const res = await fetch(url);
  const body = await res.json();
  loader.pop();

  // Process results
  if (
    !body ||
    typeof body !== "object" ||
    !body.hourly ||
    typeof body.hourly !== "object" ||
    !Array.isArray(body.hourly.time) ||
    !Array.isArray(body.hourly.temperature_2m) ||
    !Array.isArray(body.hourly.apparent_temperature) ||
    !Array.isArray(body.hourly.relativehumidity_2m) ||
    !Array.isArray(body.hourly.weathercode)
  ) {
    console.warn("Weather API returned an invalid response structure", body);
    return undefined;
  }

  const { time, temperature_2m, apparent_temperature, relativehumidity_2m, weathercode } = body.hourly;

  const validConditions = [];
  const length = Math.min(
    time.length,
    temperature_2m.length,
    apparent_temperature.length,
    relativehumidity_2m.length,
    weathercode.length
  );

  for (let i = 0; i < length; i++) {
    const t = time[i];
    const temp = temperature_2m[i];
    const appTemp = apparent_temperature[i];
    const humidity = relativehumidity_2m[i];
    const code = weathercode[i];

    if (
      typeof t === "number" &&
      typeof temp === "number" &&
      typeof appTemp === "number" &&
      typeof humidity === "number" &&
      typeof code === "number"
    ) {
      validConditions.push({
        timestamp: t * 1000, // convert to ms
        temperature: temp,
        apparentTemperature: appTemp,
        humidity: humidity,
        weatherCode: code,
      });
    }
  }

  if (validConditions.length === 0) {
    console.warn("Weather API response contained no valid data rows");
    return undefined;
  }

  return {
    timestamp: Date.now(),
    conditions: validConditions,
  };
}

/** Request current location from the browser */
export function requestLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: round(coords.latitude),
          longitude: round(coords.longitude),
        }),
      reject,
    ),
  );
}

/** Perform geocoding lookup on query string */
export async function geocodeLocation(query: string): Promise<Coordinates> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`;
  const res = await fetch(url);
  const data = await res.json();

  return {
    latitude: round(data.results[0].latitude),
    longitude: round(data.results[0].longitude),
  };
}

function round(x: number, precision = 4): number {
  return Math.round(x * 10 ** precision) / 10 ** precision;
}
