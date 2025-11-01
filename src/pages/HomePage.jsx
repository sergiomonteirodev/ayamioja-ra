import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
import MainVideo from '../components/MainVideo'
import InterpreterVideo from '../components/InterpreterVideo'
import AudioDescription from '../components/AudioDescription'
import ActionButtons from '../components/ActionButtons'

const HomePage = () => {
  const [librasActive, setLibrasActive] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)

  const handleLibrasToggle = (active) => {
    setLibrasActive(active)
    console.log('Toggle Libras:', active)
  }

  const handleAudioToggle = (active) => {
    setAudioActive(active)
    console.log('Toggle Audio:', active)
  }

  const handleVideoStateChange = (state) => {
    console.log('📹 HomePage - VideoState atualizado:', state)
    setVideoState(state)
  }

  return (
    <div>
      <Navigation />
      
      <ToggleControls 
        onLibrasToggle={handleLibrasToggle}
        onAudioToggle={handleAudioToggle}
        showLogo={false}
      />
      
      <main className="main-content">
        <div className="logo-container">
          <img src="/ayamioja-ra/images/logo_ayamioja.png" alt="Logo Ayà Mi O Já" />
        </div>
        
        <MainVideo 
          librasActive={librasActive}
          audioActive={audioActive}
          onVideoStateChange={handleVideoStateChange}
        />
        
        <ActionButtons />
      </main>

      <InterpreterVideo 
        librasActive={librasActive}
        videoState={videoState}
      />

      <AudioDescription 
        audioActive={audioActive}
        videoState={videoState}
      />
      
      <footer>Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados</footer>
    </div>
  )
}

export default HomePage
