import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const mountedRef = useRef(false)
  
  // Forçar inicialização do vídeo quando a página é montada ou quando retorna à rota
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      console.log('🏠 HomePage montado pela primeira vez')
      
      // Forçar carregamento do vídeo após um pequeno delay para garantir que o DOM está pronto
      const timer = setTimeout(() => {
        const video = document.getElementById('main-video')
        if (video && video.readyState === 0) {
          console.log('🏠 HomePage: Forçando carregamento inicial do vídeo via DOM')
          try {
            video.load()
            console.log('✅ HomePage: video.load() chamado via DOM')
          } catch (e) {
            console.error('❌ HomePage: Erro ao chamar video.load():', e)
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    } else {
      console.log('🏠 HomePage: Retornou para a rota inicial')
    }
  }, [location.pathname])

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
