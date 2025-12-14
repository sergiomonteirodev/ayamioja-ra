import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
// Importar debug WebGL apenas em desenvolvimento ou quando ?debug=true
if (import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === 'true') {
  import('./utils/webgl-debug.js')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
