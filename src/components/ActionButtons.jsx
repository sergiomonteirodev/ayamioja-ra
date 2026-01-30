import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

const ActionButtons = ({ showScanButton = true, showAccessButton = true }) => {
  const navigate = useNavigate()

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
        <Link to="/ouvir-livro" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
          Ouvir o livro
        </Link>
      )}
      <a href="#" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
        Ouvir a música
      </a>
    </div>
  )
}

export default ActionButtons
