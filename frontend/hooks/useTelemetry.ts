"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTelemetry, type TelemetryData } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;

export interface UseTelemetryResult {
  data: TelemetryData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * useTelemetry — polls /api/telemetry every 2 seconds.
 * Animates numeric changes for a live-dashboard feel.
 */
export function useTelemetry(): UseTelemetryResult {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await fetchTelemetry();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Telemetry unavailable");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll(); // immediate first fetch
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return { data, isLoading, error, lastUpdated };
}
