import React from 'react'
import { useNavigate } from 'react-router-dom'

const ActionButtons = ({ showScanButton = true, showAccessButton = true }) => {
  const navigate = useNavigate()

  const handleScanClick = () => {
    navigate('/scan')
  }

  const handleAccessClick = () => {
    // Implementar lógica para acessar a história
    console.log('Acessar história clicado')
  }

  return (
    <div className="action-buttons">
      {showScanButton && (
        <button className="btn-primary" onClick={handleScanClick}>
          Escanear o livro
        </button>
      )}
      {showAccessButton && (
        <button className="btn-secondary" onClick={handleAccessClick}>
          Ouvir o livro
        </button>
      )}
      <a href="#" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
        Ouvir a música
      </a>
    </div>
  )
}

export default ActionButtons
