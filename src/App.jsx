import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRouter from './router/AppRouter'
import { Bounce, ToastContainer } from 'react-toastify'
import axios from 'axios'
// import './App.css'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const normalizeBase = (base) => String(base || '').trim().replace(/\/+$/, '');
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

const resolveApiBase = () => {
  const configured = normalizeBase(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
  );

  const onLoopbackHost =
    typeof window !== 'undefined' ? isLoopbackHost(window.location.hostname) : false;

  if (configured) {
    if (!isAbsoluteHttpUrl(configured)) return configured;
    if (onLoopbackHost || !isLoopbackBase(configured)) return configured;
  }

  return '/api';
};

function App() {
  const API_BASE = resolveApiBase();
  axios.defaults.baseURL = API_BASE;
  axios.defaults.timeout = Number(import.meta.env.VITE_API_TIMEOUT_MS || 600000);
  
  return (
    <>
      <AppRouter></AppRouter>
      <ToastContainer
      position="bottom-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition={Bounce}
      />
      </>
  )
}

export default App
