import React, { createContext, useContext } from "react";
import { AppConfig } from "./UseConfig";

const ConfigContext = createContext<AppConfig | null>(null);

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used inside ConfigProvider");
  }
  return context;
};

export const ConfigProvider: React.FC<{
  config: AppConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
