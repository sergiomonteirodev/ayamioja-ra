import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
import MainVideo from '../components/MainVideo'
import InterpreterVideo from '../components/InterpreterVideo'
import AudioDescription from '../components/AudioDescription'
import ActionButtons from '../components/ActionButtons'

/** Momento (s) em que a bonequinha surge na animação – ajustar conforme o vídeo. */
const BONEQUINHA_TIME_SEC = 1

const HomePage = () => {
  const [librasActive, setLibrasActive] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [adPhase, setAdPhase] = useState('none') // 'none' | 'playing_ad'
  const [resumeVideoAt, setResumeVideoAt] = useState(null)
  const [resumeTrigger, setResumeTrigger] = useState(null)
  const location = useLocation()
  const mountedRef = useRef(false)

  const onPauseForAD = useCallback((resumeAt) => {
    setResumeVideoAt(resumeAt)
    setAdPhase('playing_ad')
  }, [])

  const onADEnded = useCallback(() => {
    setAdPhase('none')
    setResumeTrigger(Date.now())
  }, [])

  const onResumed = useCallback(() => {
    setResumeVideoAt(null)
    setResumeTrigger(null)
  }, [])

  const onVideoReset = useCallback(() => {
    setAdPhase('none')
    setResumeVideoAt(null)
    setResumeTrigger(null)
  }, [])
  
  // Forçar inicialização do vídeo quando a página é montada (Android-friendly)
  useEffect(() => {
    console.log('🏠 HomePage: useEffect executado - pathname:', location.pathname)
    
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    // Função para forçar carregamento do vídeo
    const forceVideoLoad = () => {
      const video = document.getElementById('main-video')
      if (video) {
        console.log('🏠 HomePage: Forçando carregamento do vídeo via DOM', {
          readyState: video.readyState,
          networkState: video.networkState,
          src: video.src
        })
        
        // Forçar atributos mobile/Android
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('x5-playsinline', 'true')
        video.playsInline = true
        
        // Android: Manter muted para autoplay funcionar
        // O MainVideo gerencia o unmute após play
        if (!isAndroid) {
          // Desktop/iOS: Pode tentar com áudio
          video.muted = false
          video.removeAttribute('muted')
        }
        
        // Forçar load() mesmo se já tiver algum readyState
        // No Android, às vezes precisa forçar múltiplas vezes
        if (video.readyState === 0 || (isAndroid && video.networkState !== 2)) {
          try {
            video.load()
            console.log('✅ HomePage: video.load() chamado via DOM')
            
            // Android: tentar novamente após pequeno delay
            if (isAndroid) {
              setTimeout(() => {
                if (video.networkState === 0 || video.readyState === 0) {
                  console.log('🔄 Android: Tentando load() novamente...')
                  try {
                    video.load()
                  } catch (e) {
                    console.warn('⚠️ Android: Erro no segundo load():', e)
                  }
                }
              }, 300)
            }
          } catch (e) {
            console.error('❌ HomePage: Erro ao chamar video.load():', e)
          }
        }
        
        // Forçar visibilidade no mobile
        if (isMobile) {
          video.style.setProperty('opacity', '1', 'important')
          video.style.setProperty('visibility', 'visible', 'important')
          video.style.setProperty('display', 'block', 'important')
          video.style.setProperty('z-index', '10', 'important')
          console.log('✅ HomePage: Visibilidade forçada no mobile')
        }
      } else {
        console.warn('⚠️ HomePage: Vídeo não encontrado no DOM ainda')
      }
    }
    
    // Executar imediatamente
    forceVideoLoad()
    
    // Timer para garantir que executa após o DOM estar pronto
    const timer = setTimeout(forceVideoLoad, 100)
    
    // Android: tentar novamente após mais tempo se ainda não carregou
    let androidRetryTimer = null
    if (isAndroid) {
      androidRetryTimer = setTimeout(() => {
        const video = document.getElementById('main-video')
        if (video && (video.readyState === 0 || video.networkState === 0)) {
          console.log('🔄 Android: Retry final após 800ms')
          forceVideoLoad()
        }
      }, 800)
    }
    
    // Listener para quando a página fica visível (importante para Android)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ HomePage: Página ficou visível - forçando vídeo')
        forceVideoLoad()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // REMOVIDO: Listener de interação que iniciava vídeo automaticamente
    // O vídeo só deve tocar quando o botão de play for clicado
    
    return () => {
      clearTimeout(timer)
      if (androidRetryTimer) clearTimeout(androidRetryTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Não remover os listeners de interação pois queremos que funcionem sempre
    }
  }, [location.pathname])

  const handleLibrasToggle = (active) => {
    setLibrasActive(active)
    console.log('Toggle Libras:', active)
  }

  const handleAudioToggle = (active) => {
    setAudioActive(active)
    console.log('Toggle Audio:', active)
    if (!active && adPhase === 'playing_ad') {
      setAdPhase('none')
      setResumeTrigger(Date.now())
    }
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
          bonequinhaTime={BONEQUINHA_TIME_SEC}
          onPauseForAD={onPauseForAD}
          resumeFrom={resumeVideoAt}
          resumeTrigger={resumeTrigger}
          onResumed={onResumed}
          onVideoReset={onVideoReset}
          adPhase={adPhase}
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
        playAdStandalone={adPhase === 'playing_ad'}
        onADEnded={onADEnded}
      />
      
      <footer>Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados</footer>
    </div>
  )
}

export default HomePage
