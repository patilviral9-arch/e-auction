import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRouter from './router/AppRouter'
import { Bounce, ToastContainer } from 'react-toastify'
import axios from 'axios'
// import './App.css'

function App() {
  const API_BASE = String(
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api"
  ).replace(/\/+$/, "");
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
