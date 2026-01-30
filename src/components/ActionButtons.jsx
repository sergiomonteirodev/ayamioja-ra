import React from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

const ActionButtons = ({ showScanButton = true, showAccessButton = true, activeButton }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isOuvirLivroActive = activeButton === 'ouvir-livro' || location.pathname === '/ouvir-livro'

  const handleScanClick = () => {
    navigate('/scan')
  }

  return (
    <div className="action-buttons">
      {showScanButton && (
        <button type="button" className="btn-primary" onClick={handleScanClick}>
          Escanear o livro
        </button>
      )}
      {showAccessButton && (
        <Link
          to="/ouvir-livro"
          className={`btn-secondary ${isOuvirLivroActive ? 'btn-secondary--active' : ''}`}
          style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
        >
          Ouvir o livro
        </Link>
      )}
      <a
        href="https://youtu.be/XHTVWdPQRbw"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary"
        style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
      >
        Ouvir a música
      </a>
    </div>
  )
}

export default ActionButtons
