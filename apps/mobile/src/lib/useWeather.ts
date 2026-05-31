import { useEffect, useState } from 'react';

interface Weather {
  temperatureC: number;
  label: string;
}

const REFRESH_MS = 30 * 60 * 1000;

export function useWeather(
  latitude: number,
  longitude: number,
  fallback: Weather,
): Weather {
  const [weather, setWeather] = useState<Weather>(fallback);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = (await res.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };
        const temp = json.current?.temperature_2m;
        const code = json.current?.weather_code;
        if (cancelled || typeof temp !== 'number') return;
        setWeather({
          temperatureC: Math.round(temp),
          label: labelFor(code),
        });
      } catch {
        // keep fallback
      }
    };

    void fetchWeather();
    const id = setInterval(fetchWeather, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [latitude, longitude]);

  return weather;
}

function labelFor(code?: number): string {
  if (code === undefined) return 'Clear skies';
  if (code === 0) return 'Clear skies';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Pine mist';
  if (code >= 51 && code <= 57) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Steady rain';
  if (code >= 66 && code <= 67) return 'Freezing rain';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Passing showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clear skies';
}
