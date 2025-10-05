import React, { useState, useEffect } from 'react'
import SafeImage from './SafeImage'

const ToggleControls = ({ onLibrasToggle, onAudioToggle, showLogo = false, initialLibrasActive = false, initialAudioActive = false }) => {
  const [librasActive, setLibrasActive] = useState(initialLibrasActive)
  const [audioActive, setAudioActive] = useState(initialAudioActive)

  useEffect(() => {
    // Callback para notificar o componente pai sobre mudanças
    if (onLibrasToggle) {
      onLibrasToggle(librasActive)
    }
  }, [librasActive, onLibrasToggle])

  useEffect(() => {
    // Callback para notificar o componente pai sobre mudanças
    if (onAudioToggle) {
      onAudioToggle(audioActive)
    }
  }, [audioActive, onAudioToggle])

  const handleLibrasChange = (e) => {
    setLibrasActive(e.target.checked)
  }

  const handleAudioChange = (e) => {
    setAudioActive(e.target.checked)
  }

  return (
    <div className="toggle-controls">
      {/* Container para os toggles lado a lado */}
      <div className="toggles-row">
        <div className="toggle-left">
          <label className="toggle-label">
            <SafeImage src="/ayamioja-ra/images/libras.png" alt="Libras" className="toggle-icon" />
            <input 
              type="checkbox" 
              className="toggle-input"
              checked={librasActive}
              onChange={handleLibrasChange}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="toggle-right">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              className="toggle-input"
              checked={audioActive}
              onChange={handleAudioChange}
            />
            <span className="toggle-slider"></span>
            <SafeImage src="/ayamioja-ra/images/ad.png" alt="áudio descrição" className="toggle-icon" />
          </label>
        </div>
      </div>
      
      {/* Logo abaixo dos toggles */}
      {showLogo && (
        <div className="logo-container">
          <SafeImage src="/ayamioja-ra/images/logo_ayamioja.png" alt="Logo Ayà Mi O Já" />
        </div>
      )}
    </div>
  )
}

export default ToggleControls
