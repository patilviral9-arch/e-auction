import axios from 'axios';

let resolvedApiBase = null;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const normalizeBase = (base) => String(base || '').trim().replace(/\/+$/, '');
const uniq = (list) => [...new Set(list.map(normalizeBase).filter(Boolean))];
const ensureLeadingSlash = (path) => {
  const value = String(path || '');
  return value.startsWith('/') ? value : `/${value}`;
};

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const isLoopbackHost = (host = '') => {
  const value = String(host || '').toLowerCase();
  if (!value) return false;
  if (LOOPBACK_HOSTS.has(value)) return true;
  if (value.startsWith('127.')) return true;
  return false;
};

const isLoopbackBase = (base) => {
  if (!isAbsoluteHttpUrl(base)) return false;

  try {
    const parsed = new URL(base);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
};

const isRunningOnLoopback = () => {
  if (typeof window === 'undefined') return false;
  return isLoopbackHost(window.location.hostname);
};

const shouldUseConfiguredBase = (base) => {
  const normalized = normalizeBase(base);
  if (!normalized) return false;

  if (!isAbsoluteHttpUrl(normalized)) return true;
  if (isRunningOnLoopback()) return true;

  return !isLoopbackBase(normalized);
};

const withBase = (base, path) => `${normalizeBase(base)}${ensureLeadingSlash(path)}`;

const isHtmlLike = (response) => {
  const contentType = String(response?.headers?.['content-type'] || '').toLowerCase();
  if (contentType.includes('text/html')) return true;

  if (typeof response?.data === 'string') {
    const sample = response.data.trim().slice(0, 80).toLowerCase();
    if (sample.startsWith('<!doctype html') || sample.startsWith('<html')) return true;
  }

  return false;
};

const withAuthConfig = (config = {}) => {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null;

  const headers = { ...(config.headers || {}) };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { ...config, headers };
};

export const getApiBaseCandidates = (extraCandidates = []) => {
  const envCandidates = [
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_BASE_URL,
    axios.defaults.baseURL,
  ].filter(shouldUseConfiguredBase);

  const origin = typeof window !== 'undefined' ? normalizeBase(window.location.origin) : '';

  return uniq([
    resolvedApiBase,
    ...extraCandidates,
    ...envCandidates,
    '/api',
    origin ? `${origin}/api` : null,
    origin,
  ]);
};

export const apiGet = async (path, config = {}) => {
  const candidates = getApiBaseCandidates();
  let lastError = null;

  for (const base of candidates) {
    try {
      const response = await axios.get(withBase(base, path), withAuthConfig(config));
      if (isHtmlLike(response)) {
        lastError = new Error(`Received HTML instead of API JSON from ${withBase(base, path)}`);
        continue;
      }

      resolvedApiBase = base;
      return response;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldContinue = !status || status === 404 || status === 405;

      if (!shouldContinue) throw error;
    }
  }

  throw lastError || new Error(`Failed to load ${path}`);
};

const apiRequest = async (method, path, data, config = {}) => {
  const base = getApiBaseCandidates()[0] || '/api';
  const requestConfig = withAuthConfig({
    ...config,
    method,
    url: withBase(base, path),
  });

  if (data !== undefined) {
    requestConfig.data = data;
  }

  const response = await axios.request(requestConfig);

  if (isHtmlLike(response)) {
    throw new Error(`Received HTML instead of API JSON from ${requestConfig.url}`);
  }

  resolvedApiBase = base;
  return response;
};

export const apiPost = (path, data, config = {}) => apiRequest('post', path, data, config);
export const apiPut = (path, data, config = {}) => apiRequest('put', path, data, config);
export const apiDelete = (path, config = {}) => apiRequest('delete', path, undefined, config);
