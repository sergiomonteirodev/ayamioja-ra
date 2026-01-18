import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const videoRef = useRef(null)

  // Caminho do vídeo usando BASE_URL do Vite (respeita base path)
  const videoPath = `${import.meta.env.BASE_URL}videos/anim_ayo.mp4`

  // Detectar mobile
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Ajustar volume baseado no toggle de audiodescrição
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (audioActive) {
      video.volume = 0.2
    } else {
      video.volume = 0.7
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

  // Forçar carregamento e visibilidade do vídeo quando componente monta
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      console.warn('⚠️ MainVideo: videoRef.current é null')
      return
    }

    // Verificar se vídeo está no DOM
    if (!document.body.contains(video)) {
      console.error('❌ MainVideo: Vídeo não está no DOM!')
      return
    }

    // Verificar se há elementos cobrindo o vídeo
    const rect = video.getBoundingClientRect()
    const elementAtPoint = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    if (elementAtPoint && elementAtPoint !== video && !video.contains(elementAtPoint)) {
      console.warn('⚠️ MainVideo: Elemento cobrindo o vídeo:', {
        element: elementAtPoint,
        tagName: elementAtPoint.tagName,
        id: elementAtPoint.id,
        className: elementAtPoint.className
      })
    }

    console.log('🎬 MainVideo: Verificando vídeo no mount:', {
      src: video.src || videoPath,
      readyState: video.readyState,
      networkState: video.networkState,
      width: video.offsetWidth,
      height: video.offsetHeight,
      boundingRect: rect,
      elementAtCenter: elementAtPoint?.tagName,
      computedStyle: {
        display: window.getComputedStyle(video).display,
        visibility: window.getComputedStyle(video).visibility,
        opacity: window.getComputedStyle(video).opacity,
        zIndex: window.getComputedStyle(video).zIndex,
        position: window.getComputedStyle(video).position
      }
    })

    // Garantir que src está definido
    if (!video.src && videoPath) {
      video.src = videoPath
      console.log('✅ MainVideo: src definido:', videoPath)
    }

    // FORÇAR visibilidade IMEDIATAMENTE
    video.style.setProperty('opacity', '1', 'important')
    video.style.setProperty('visibility', 'visible', 'important')
    video.style.setProperty('display', 'block', 'important')
    video.style.setProperty('z-index', '15', 'important')
    video.style.opacity = '1'
    video.style.visibility = 'visible'
    video.style.display = 'block'
    video.style.zIndex = '15'

    // Forçar load() para garantir que o vídeo comece a carregar
    try {
      video.load()
      console.log('✅ MainVideo: video.load() chamado no mount')
      
      // Verificar após um tempo se o vídeo começou a carregar
      setTimeout(() => {
        console.log('📊 MainVideo: Estado após load():', {
          readyState: video.readyState,
          networkState: video.networkState,
          src: video.src,
          width: video.offsetWidth,
          height: video.offsetHeight,
          computedDisplay: window.getComputedStyle(video).display,
          computedVisibility: window.getComputedStyle(video).visibility,
          computedOpacity: window.getComputedStyle(video).opacity
        })
        
        // FORÇAR visibilidade novamente após 500ms
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '15', 'important')
      }, 500)
    } catch (e) {
      console.error('❌ MainVideo: Erro ao chamar video.load():', e)
    }

    // FORÇAR visibilidade periodicamente para garantir que vídeo sempre apareça
    const forceVisibilityInterval = setInterval(() => {
      const v = videoRef.current
      if (v) {
        v.style.setProperty('opacity', '1', 'important')
        v.style.setProperty('visibility', 'visible', 'important')
        v.style.setProperty('display', 'block', 'important')
        v.style.setProperty('z-index', '15', 'important')
      }
    }, 200)

    return () => {
      clearInterval(forceVisibilityInterval)
    }
  }, [videoPath])

  // Event listeners simples para loading
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      console.log('✅ MainVideo: canplay event - vídeo pode reproduzir')
      setShowLoading(false)
      // Forçar visibilidade quando vídeo pode reproduzir
      if (video) {
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '15', 'important')
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '15'
        console.log('✅ MainVideo: Visibilidade forçada no canplay', {
          width: video.offsetWidth,
          height: video.offsetHeight
        })
      }
    }

    const handleLoadedData = () => {
      console.log('✅ MainVideo: loadeddata event - dados carregados')
      setShowLoading(false)
      // Forçar visibilidade quando dados carregam
      if (video) {
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '15', 'important')
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '15'
        console.log('✅ MainVideo: Visibilidade forçada no loadeddata', {
          width: video.offsetWidth,
          height: video.offsetHeight
        })
      }
    }

    const handleEnded = () => {
      setShowReplay(true)
      setHasEnded(true)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const percent = Math.min((bufferedEnd / video.duration) * 100, 99)
        setLoadingProgress(Math.round(percent))
      }
    }

    const handleError = (e) => {
      console.error('❌ MainVideo: Erro ao carregar vídeo:', {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        src: video.src
      })
      setShowLoading(false)
    }

    const handleLoadedMetadata = () => {
      console.log('✅ MainVideo: loadedmetadata - metadados carregados')
      setShowLoading(false)
      // Forçar visibilidade também aqui
      if (video) {
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '15', 'important')
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '15'
      }
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('error', handleError)
    }
  }, [])

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
          {/* Loading Placeholder - DESABILITADO para garantir que não cubra o vídeo */}
          {/* {showLoading && !isMobile && (
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
          )} */}
          
          {/* Vídeo SIMPLES - sem complexidade desnecessária */}
          <video 
            ref={videoRef}
            id="main-video" 
            className="main-video" 
            src={videoPath}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            preload="auto"
            loop={false}
            style={{
              opacity: 1,
              visibility: 'visible',
              display: 'block',
              zIndex: 15,
              position: 'absolute'
            }}
          >
            <source src={videoPath} type="video/mp4" />
            Seu navegador não suporta vídeos HTML5.
          </video>

          {/* Botão Assistir Novamente */}
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
