// UseConfig.ts
import { useEffect, useState } from "react";

export interface AppConfig {
  PORT: number;
  ENDPOINT: string;
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/setup.json")
      .then((res) => res.json())
      .then((data: AppConfig) => setConfig(data))
      .catch((err) => console.error("Failed to load config:", err));
  }, []);

  return config;
}
