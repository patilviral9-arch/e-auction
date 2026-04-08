import { useEffect, useState } from "react";

const SETTINGS_FEATURES_KEY = "settings_features";
const MAINTENANCE_EVENT = "maintenance-mode-changed";

export const getMaintenanceMode = () => {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(SETTINGS_FEATURES_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.maintenanceMode);
  } catch {
    return false;
  }
};

export const notifyMaintenanceModeChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MAINTENANCE_EVENT));
};

export const useMaintenanceMode = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(getMaintenanceMode);

  useEffect(() => {
    const sync = () => setMaintenanceMode(getMaintenanceMode());

    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === SETTINGS_FEATURES_KEY) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(MAINTENANCE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(MAINTENANCE_EVENT, sync);
    };
  }, []);

  return maintenanceMode;
};

