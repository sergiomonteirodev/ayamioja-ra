import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ScanPage from './pages/ScanPage'
import OuvirLivroPage from './pages/OuvirLivroPage'
import AboutPage from './pages/AboutPage'
import TeamPage from './pages/TeamPage'

function App() {
  // Usa o BASE_URL definido pelo Vite (/ para Hostinger, /ayamioja-ra/ para GitHub Pages)
  const basename = import.meta.env.BASE_URL || '/'
  
  return (
    <Router
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/ouvir-livro" element={<OuvirLivroPage />} /> {/* Botão "Ouvir o livro" na home */}
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/equipe" element={<TeamPage />} />
      </Routes>
    </Router>
  )
}

export default App
