import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
// Importar debug WebGL apenas em desenvolvimento ou quando ?debug=true
if (import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === 'true') {
  import('./utils/webgl-debug.js')
}

// Removido StrictMode para evitar montagem dupla do A-Frame que causa tela preta no Android
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
