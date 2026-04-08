import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useTheme } from '../../context/ThemeContext';
import { notifyMaintenanceModeChange } from '../../hooks/useMaintenanceMode';

const DEFAULT_PLATFORM = {
  name: 'E-Auction',
  supportEmail: 'support@e-auction.com',
  commission: '10',
  minBid: '50',
};

const DEFAULT_FEATURES = {
  darkMode: true,
  autoApprove: false,
  emailNotifications: true,
  proxyBidding: true,
  maintenanceMode: false,
};

const DEFAULT_SECURITY = {
  sessionTimeout: '30',
  maxLoginAttempts: '5',
};

const STORAGE_KEY_PLATFORM = 'settings_platform';
const STORAGE_KEY_FEATURES = 'settings_features';
const STORAGE_KEY_SECURITY = 'settings_security';
const STORAGE_KEY_SAVED_AT = 'settings_saved_at';

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
};

const Toggle = ({ enabled, onToggle, danger = false }) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={enabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? (danger ? 'bg-red-500' : 'bg-indigo-600') : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

const toNumericString = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric}` : '0';
};

const getInitialSettings = (theme) => {
  const platform = loadFromStorage(STORAGE_KEY_PLATFORM, DEFAULT_PLATFORM);
  const savedFeatures = loadFromStorage(STORAGE_KEY_FEATURES, DEFAULT_FEATURES);
  const features = {
    ...DEFAULT_FEATURES,
    ...savedFeatures,
    darkMode:
      typeof savedFeatures.darkMode === 'boolean'
        ? savedFeatures.darkMode
        : theme === 'dark',
  };
  const security = loadFromStorage(STORAGE_KEY_SECURITY, DEFAULT_SECURITY);

  return { platform, features, security };
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [initial] = useState(() => getInitialSettings(theme));

  const [platform, setPlatform] = useState(initial.platform);
  const [features, setFeatures] = useState(initial.features);
  const [security, setSecurity] = useState(initial.security);
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(() => localStorage.getItem(STORAGE_KEY_SAVED_AT) || '');
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));

  const dirty = useMemo(
    () => JSON.stringify({ platform, features, security }) !== baseline,
    [platform, features, security, baseline]
  );

  const validate = () => {
    const next = {};

    if (!platform.name.trim()) {
      next.name = 'Site name is required.';
    }

    if (platform.supportEmail.trim()) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(platform.supportEmail.trim());
      if (!validEmail) {
        next.supportEmail = 'Please enter a valid email address.';
      }
    }

    const commission = Number(platform.commission);
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      next.commission = 'Commission must be between 0 and 100.';
    }

    const minBid = Number(platform.minBid);
    if (!Number.isFinite(minBid) || minBid < 0) {
      next.minBid = 'Minimum bid must be 0 or greater.';
    }

    const timeout = Number(security.sessionTimeout);
    if (!Number.isFinite(timeout) || timeout < 5 || timeout > 240) {
      next.sessionTimeout = 'Session timeout must be between 5 and 240 minutes.';
    }

    const attempts = Number(security.maxLoginAttempts);
    if (!Number.isFinite(attempts) || attempts < 1 || attempts > 10) {
      next.maxLoginAttempts = 'Max attempts must be between 1 and 10.';
    }

    return next;
  };

  const setFeatureValue = (key, value) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
    if (key === 'darkMode') {
      toggleTheme(value ? 'dark' : 'light');
    }
  };

  const toggleFeature = (key) => {
    if (key === 'maintenanceMode' && !features.maintenanceMode) {
      Swal.fire({
        title: 'Enable maintenance mode?',
        text: 'Users will not be able to use the auction app until it is disabled.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Enable',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef4444',
      }).then((result) => {
        if (result.isConfirmed) {
          setFeatureValue('maintenanceMode', true);
        }
      });
      return;
    }

    setFeatureValue(key, !features[key]);
  };

  const handleSave = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      Swal.fire({
        icon: 'error',
        title: 'Fix validation errors first',
      });
      return;
    }

    const normalizedPlatform = {
      ...platform,
      name: platform.name.trim(),
      supportEmail: platform.supportEmail.trim(),
      commission: toNumericString(platform.commission),
      minBid: toNumericString(platform.minBid),
    };

    const normalizedSecurity = {
      sessionTimeout: toNumericString(security.sessionTimeout),
      maxLoginAttempts: toNumericString(security.maxLoginAttempts),
    };

    localStorage.setItem(STORAGE_KEY_PLATFORM, JSON.stringify(normalizedPlatform));
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
    localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(normalizedSecurity));
    notifyMaintenanceModeChange();

    const nowIso = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_SAVED_AT, nowIso);

    setPlatform(normalizedPlatform);
    setSecurity(normalizedSecurity);
    setErrors({});
    setSavedAt(nowIso);
    setBaseline(
      JSON.stringify({
        platform: normalizedPlatform,
        features,
        security: normalizedSecurity,
      })
    );

    Swal.fire({
      icon: 'success',
      title: 'Settings saved',
      toast: true,
      timer: 2000,
      position: 'top-end',
      showConfirmButton: false,
    });
  };

  const handleReset = () => {
    Swal.fire({
      title: 'Reset all settings?',
      text: 'This restores defaults and removes local saved values.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setPlatform(DEFAULT_PLATFORM);
      setFeatures(DEFAULT_FEATURES);
      setSecurity(DEFAULT_SECURITY);
      setErrors({});
      setSavedAt('');

      localStorage.removeItem(STORAGE_KEY_PLATFORM);
      localStorage.removeItem(STORAGE_KEY_FEATURES);
      localStorage.removeItem(STORAGE_KEY_SECURITY);
      localStorage.removeItem(STORAGE_KEY_SAVED_AT);
      notifyMaintenanceModeChange();

      setBaseline(
        JSON.stringify({
          platform: DEFAULT_PLATFORM,
          features: DEFAULT_FEATURES,
          security: DEFAULT_SECURITY,
        })
      );

      toggleTheme(DEFAULT_FEATURES.darkMode ? 'dark' : 'light');

      Swal.fire({
        icon: 'success',
        title: 'Defaults restored',
        toast: true,
        timer: 1800,
        position: 'top-end',
        showConfirmButton: false,
      });
    });
  };

  const featureRows = [
    {
      key: 'darkMode',
      label: 'Dark mode',
      description: 'Switch the global app theme between dark and light.',
      danger: false,
    },
    {
      key: 'autoApprove',
      label: 'Auto-approve auctions',
      description: 'Automatically approve listings from trusted sellers.',
      danger: false,
    },
    {
      key: 'emailNotifications',
      label: 'Email notifications',
      description: 'Send outbid and winning alerts to users.',
      danger: false,
    },
    {
      key: 'proxyBidding',
      label: 'Proxy bidding',
      description: 'Allow users to set a maximum automatic bid.',
      danger: false,
    },
    {
      key: 'maintenanceMode',
      label: 'Maintenance mode',
      description: 'Temporarily block the app while maintenance is in progress.',
      danger: true,
    },
  ];

  const formatSavedAt = (value) => {
    if (!value) return 'Not saved yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not saved yet';
    return date.toLocaleString();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform defaults and feature switches.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Last saved: {formatSavedAt(savedAt)}
          </span>
          {dirty ? (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Unsaved changes
            </span>
          ) : null}
        </div>
      </div>

      {features.maintenanceMode ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Maintenance mode is currently enabled. Users should see maintenance messaging.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Platform Configuration</h2>
            <p className="text-xs text-gray-500 mt-1">Core values used across auctions and pricing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-600">Site name</span>
              <input
                type="text"
                value={platform.name}
                onChange={(e) => {
                  setPlatform((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name}</p> : null}
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Support email</span>
              <input
                type="email"
                value={platform.supportEmail}
                onChange={(e) => {
                  setPlatform((prev) => ({ ...prev, supportEmail: e.target.value }));
                  setErrors((prev) => ({ ...prev, supportEmail: undefined }));
                }}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {errors.supportEmail ? (
                <p className="text-xs text-red-600 mt-1">{errors.supportEmail}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Commission (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={platform.commission}
                onChange={(e) => {
                  setPlatform((prev) => ({ ...prev, commission: e.target.value }));
                  setErrors((prev) => ({ ...prev, commission: undefined }));
                }}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {errors.commission ? (
                <p className="text-xs text-red-600 mt-1">{errors.commission}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Minimum bid increment</span>
              <input
                type="number"
                min="0"
                value={platform.minBid}
                onChange={(e) => {
                  setPlatform((prev) => ({ ...prev, minBid: e.target.value }));
                  setErrors((prev) => ({ ...prev, minBid: undefined }));
                }}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {errors.minBid ? <p className="text-xs text-red-600 mt-1">{errors.minBid}</p> : null}
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Security Defaults</h2>
            <p className="text-xs text-gray-500 mt-1">Session and login protection settings.</p>
          </div>

          <label className="block">
            <span className="text-sm text-gray-600">Session timeout (minutes)</span>
            <input
              type="number"
              min="5"
              max="240"
              value={security.sessionTimeout}
              onChange={(e) => {
                setSecurity((prev) => ({ ...prev, sessionTimeout: e.target.value }));
                setErrors((prev) => ({ ...prev, sessionTimeout: undefined }));
              }}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            />
            {errors.sessionTimeout ? (
              <p className="text-xs text-red-600 mt-1">{errors.sessionTimeout}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Max failed login attempts</span>
            <input
              type="number"
              min="1"
              max="10"
              value={security.maxLoginAttempts}
              onChange={(e) => {
                setSecurity((prev) => ({ ...prev, maxLoginAttempts: e.target.value }));
                setErrors((prev) => ({ ...prev, maxLoginAttempts: undefined }));
              }}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            />
            {errors.maxLoginAttempts ? (
              <p className="text-xs text-red-600 mt-1">{errors.maxLoginAttempts}</p>
            ) : null}
          </label>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            These settings are currently stored in browser local storage for admin panel behavior.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800">Feature Toggles</h2>
          <p className="text-xs text-gray-500 mt-1">Enable or disable optional system capabilities.</p>
        </div>

        <div className="divide-y divide-gray-100">
          {featureRows.map((feature) => (
            <div key={feature.key} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{feature.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
              </div>
              <Toggle
                enabled={Boolean(features[feature.key])}
                onToggle={() => toggleFeature(feature.key)}
                danger={feature.danger}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          Save Settings
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
        >
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
