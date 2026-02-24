import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRouter from './router/Approuter'
import { Bounce, ToastContainer } from 'react-toastify'
// import './App.css'

function App() {
 

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
