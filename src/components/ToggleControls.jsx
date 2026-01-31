import React, { useState, useEffect, useRef } from 'react'
import SafeImage from './SafeImage'

const ToggleControls = ({ onLibrasToggle, onAudioToggle, showLogo = false, initialLibrasActive = false, initialAudioActive = false, librasDisabled = false, audioDisabled = false }) => {
  const [librasActive, setLibrasActive] = useState(initialLibrasActive)
  const [audioActive, setAudioActive] = useState(initialAudioActive)

  // CRÍTICO: Usar useRef para evitar loops infinitos
  // Só chamar callbacks quando o valor realmente mudar (não a cada render)
  const prevLibrasActive = useRef(initialLibrasActive)
  const prevAudioActive = useRef(initialAudioActive)
  
  useEffect(() => {
    // Só chamar callback se o valor realmente mudou
    if (prevLibrasActive.current !== librasActive && onLibrasToggle) {
      prevLibrasActive.current = librasActive
      onLibrasToggle(librasActive)
    }
  }, [librasActive, onLibrasToggle])

  useEffect(() => {
    // Só chamar callback se o valor realmente mudou
    if (prevAudioActive.current !== audioActive && onAudioToggle) {
      prevAudioActive.current = audioActive
      onAudioToggle(audioActive)
    }
  }, [audioActive, onAudioToggle])

  const handleLibrasChange = (e) => {
    if (!librasDisabled) {
      setLibrasActive(e.target.checked)
    }
  }

  const handleAudioChange = (e) => {
    if (!audioDisabled) {
      setAudioActive(e.target.checked)
    }
  }

  return (
    <div className="toggle-controls">
      {/* Container para os toggles lado a lado */}
      <div className="toggles-row">
        <div className="toggle-left">
          <label className="toggle-label">
            <SafeImage src="/images/libras.png" alt="Libras" className="toggle-icon" />
            <input 
              type="checkbox" 
              className="toggle-input"
              checked={librasActive}
              onChange={handleLibrasChange}
              disabled={librasDisabled}
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
              disabled={audioDisabled}
            />
            <span className="toggle-slider"></span>
            <SafeImage src="/images/ad.png" alt="áudio descrição" className="toggle-icon" />
          </label>
        </div>
      </div>
      
      {/* Logo abaixo dos toggles */}
      {showLogo && (
        <div className="logo-container">
          <SafeImage src="/images/logo_ayamioja.png" alt="Logo Ayà Mi O Já" />
        </div>
      )}
    </div>
  )
}

export default ToggleControls
