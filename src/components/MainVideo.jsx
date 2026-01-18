import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const videoRef = useRef(null)

  // Caminho do vídeo usando BASE_URL do Vite (respeita base path)
  const videoPath = `${import.meta.env.BASE_URL}videos/anim_ayo.mp4`

  // Forçar carregamento do vídeo no mount inicial
  useEffect(() => {
    // Aguardar próximo tick para garantir que DOM foi renderizado
    const timer = setTimeout(() => {
      const video = videoRef.current
      if (!video) return

      // Verificar se o vídeo está no DOM
      if (!document.body.contains(video)) {
        console.warn('⚠️ Vídeo ainda não está no DOM')
        return
      }

      // Verificar se source está presente
      const source = video.querySelector('source')
      if (!source || !source.src) {
        console.warn('⚠️ Source tag não encontrada ou sem src')
        return
      }

      // Forçar load() para garantir que o vídeo comece a carregar imediatamente
      console.log('🚀 Forçando carregamento inicial do vídeo:', source.src)
      
      // Garantir atributos necessários
      video.setAttribute('playsinline', '')
      video.playsInline = true
      
      // Chamar load() explicitamente
      try {
        video.load()
      } catch (e) {
        console.error('❌ Erro ao chamar video.load():', e)
      }
    }, 50) // Pequeno delay para garantir que React renderizou

    return () => clearTimeout(timer)
  }, []) // Executar apenas uma vez no mount

  // Ajustar volume baseado no toggle de audiodescrição
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (audioActive) {
      video.volume = 0.2 // Volume baixo quando AD está ativo
    } else {
      video.volume = 0.7 // Volume normal quando AD está desativado
    }
  }, [audioActive])

  // Atualizar estado do vídeo quando necessário
  useEffect(() => {
    const video = videoRef.current
    if (!video || !onVideoStateChange) return

    const updateVideoState = () => {
      onVideoStateChange({ 
        isPlaying: !video.paused && !video.ended, 
        currentTime: video.currentTime 
      })
    }

    const handlePlay = () => updateVideoState()
    const handlePause = () => updateVideoState()
    const handleTimeUpdate = () => updateVideoState()
    const handleEnded = () => updateVideoState()

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onVideoStateChange])

  // Event listeners do vídeo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setLoadingProgress(15)
    }

    const handleProgress = () => {
      // Calcular progresso baseado no buffer
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const percent = Math.min((bufferedEnd / video.duration) * 100, 99)
        setLoadingProgress(Math.round(percent))
      }
    }

    const handleLoadedData = () => {
      setLoadingProgress(100)
      setShowLoading(false)
      // Forçar visibilidade do vídeo
      video.style.opacity = '1'
      video.style.visibility = 'visible'
      video.style.display = 'block'
      video.style.zIndex = '5'
    }

    const handleCanPlay = () => {
      setLoadingProgress(100)
      setShowLoading(false)
      // Forçar visibilidade do vídeo
      video.style.opacity = '1'
      video.style.visibility = 'visible'
      video.style.display = 'block'
      video.style.zIndex = '5'
      // Tentar autoplay apenas uma vez
      if (video.paused && !hasEnded) {
        video.play().catch(() => {
          // Ignorar erro de autoplay - usuário precisará interagir
        })
      }
    }

    const handleCanPlayThrough = () => {
      setLoadingProgress(100)
      setShowLoading(false)
    }

    const handlePlay = () => {
      setShowLoading(false)
      // Forçar visibilidade do vídeo
      video.style.opacity = '1'
      video.style.visibility = 'visible'
      video.style.display = 'block'
      video.style.zIndex = '5'
    }

    const handlePlaying = () => {
      setShowLoading(false)
      // Forçar visibilidade do vídeo
      video.style.opacity = '1'
      video.style.visibility = 'visible'
      video.style.display = 'block'
      video.style.zIndex = '5'
    }

    const handleEnded = () => {
      setShowReplay(true)
      setHasEnded(true)
    }

    const handleError = () => {
      console.error('❌ Erro ao carregar vídeo')
      setShowLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('play', handlePlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    // Fallback: esconder loading após 3 segundos se vídeo tiver metadados
    const fallbackTimeout = setTimeout(() => {
      if (video.readyState >= 1) {
        setShowLoading(false)
        // Forçar visibilidade do vídeo também
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        console.log('✅ Fallback: vídeo forçado a aparecer (readyState >= 1)')
      }
    }, 3000)

    // Fallback adicional: forçar visibilidade após 1 segundo se vídeo estiver no DOM
    const forceVisibilityTimeout = setTimeout(() => {
      if (video.readyState >= 1 || video.readyState >= 2) {
        setShowLoading(false)
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
        console.log('✅ Fallback: vídeo forçado a aparecer (1s)')
      }
    }, 1000)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      clearTimeout(fallbackTimeout)
      clearTimeout(forceVisibilityTimeout)
    }
  }, [hasEnded])

  // Forçar visibilidade do vídeo periodicamente quando estiver pronto
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const checkAndForceVisibility = () => {
      // Se vídeo tem metadados e está carregado, forçar visibilidade
      if (video.readyState >= 1 && showLoading) {
        setShowLoading(false)
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
        console.log('✅ Forçando visibilidade do vídeo (readyState >= 1)')
      }
      
      // Se vídeo pode reproduzir, garantir visibilidade
      if (video.readyState >= 2) {
        setShowLoading(false)
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
      }
    }

    // Verificar imediatamente
    checkAndForceVisibility()

    // Verificar periodicamente a cada 500ms
    const interval = setInterval(checkAndForceVisibility, 500)

    return () => {
      clearInterval(interval)
    }
  }, [showLoading])

  const handleReplay = () => {
    const video = videoRef.current
    if (!video) return

    setShowReplay(false)
    setHasEnded(false)
    video.currentTime = 0
    video.play().catch(() => {
      // Ignorar erro
    })
  }

  return (
    <section className="circle-section">
      <div className="circular-text-container">
        <div className="main-circle">
          {/* Loading Placeholder */}
          {showLoading && (
            <div id="video-loading" className="video-loading">
              <div className="loading-spinner"></div>
              <div className="loading-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="loading-percentage">{loadingProgress}%</p>
              </div>
              <p className="loading-text">Carregando vídeo...</p>
            </div>
          )}
          
          <video 
            ref={videoRef}
            id="main-video" 
            className="main-video" 
            playsInline
            preload="auto"
            loop={false}
            style={{
              opacity: showLoading ? 0 : 1,
              visibility: 'visible',
              display: 'block',
              zIndex: showLoading ? 2 : 5,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src={videoPath} type="video/mp4" />
            Seu navegador não suporta vídeos HTML5.
          </video>

          {/* Botão Assistir Novamente - só aparece quando o vídeo terminar */}
          {showReplay && hasEnded && (
            <button className="replay-button" onClick={handleReplay}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v3h4v4h-4v3z"/>
              </svg>
              Assistir Novamente
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default MainVideo
