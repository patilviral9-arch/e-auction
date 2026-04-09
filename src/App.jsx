import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRouter from './router/AppRouter'
import { Bounce, ToastContainer } from 'react-toastify'
import axios from 'axios'
// import './App.css'

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://your-railway-link.up.railway.app";
  axios.defaults.timeout = 75000;
  
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

