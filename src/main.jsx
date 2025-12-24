import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
// REMOVIDO: webgl-debug.js estava interceptando getContext e causando problemas
// O A-Frame gerencia o contexto WebGL - não devemos interceptar getContext

// Removido StrictMode para evitar montagem dupla do A-Frame que causa tela preta no Android
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
