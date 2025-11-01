import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const videoRef = useRef(null)

  // Detectar iOS/iPhone/Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isAppleDevice = isIOS || isSafari

  // Detectar interação do usuário para ativar áudio em dispositivos Apple
  useEffect(() => {
    if (!isAppleDevice) return

    const handleUserInteraction = () => {
      console.log('👆 Usuário interagiu - ativando áudio')
      setUserInteracted(true)
      
      // Remover event listeners após primeira interação
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
    }

    document.addEventListener('touchstart', handleUserInteraction, { once: true })
    document.addEventListener('click', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
    }
  }, [isAppleDevice])

  // Ajustar volume baseado no toggle de audiodescrição
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isAppleDevice && !userInteracted) {
      // Para Apple, manter muted até interação
      return
    }

    // Quando audiodescrição está ativa, reduzir volume do vídeo principal
    if (audioActive) {
      video.volume = 0.2 // Volume baixo quando AD está ativo
      console.log('🔊 Volume do vídeo principal reduzido para 0.2 (AD ativo)')
    } else {
      video.volume = 0.7 // Volume normal quando AD está desativado
      console.log('🔊 Volume do vídeo principal normalizado para 0.7 (AD desativado)')
    }
  }, [audioActive, isAppleDevice, userInteracted])

  // Atualizar estado do vídeo continuamente
  useEffect(() => {
    const video = videoRef.current
    if (!video || !onVideoStateChange) return

    const updateVideoState = () => {
      if (!video.paused) {
        onVideoStateChange({ 
          isPlaying: true, 
          currentTime: video.currentTime 
        })
      }
    }

    // Atualizar a cada 100ms
    const interval = setInterval(updateVideoState, 100)

    return () => clearInterval(interval)
  }, [onVideoStateChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Configurar vídeo - SEM LOOP
    video.loop = false
    if (isAppleDevice && !userInteracted) {
      video.muted = true
      video.volume = 0
    } else {
      video.muted = false
      // Volume baixo se audiodescrição estiver ativa, normal caso contrário
      video.volume = audioActive ? 0.2 : 0.7
    }

    // Event listeners
    const handleLoadedData = () => {
      console.log('✅ Vídeo carregado - escondendo loading')
      setShowLoading(false)
      setLoadingProgress(100)
    }

    const handleCanPlay = () => {
      console.log('✅ Vídeo pode reproduzir - escondendo loading')
      setShowLoading(false)
      setLoadingProgress(100)
      
      // Iniciar reprodução automática apenas na primeira vez
      if (!hasEnded && video.paused && video.currentTime === 0) {
        console.log('🎬 Iniciando reprodução automática inicial')
        video.play().catch(e => console.log('❌ Erro ao iniciar autoplay:', e))
      }
    }

    const handleCanPlayThrough = () => {
      console.log('✅ Vídeo totalmente carregado - escondendo loading')
      setShowLoading(false)
      setLoadingProgress(100)
      
      // Iniciar reprodução automática apenas na primeira vez
      if (!hasEnded && video.paused && video.currentTime === 0) {
        console.log('🎬 Iniciando reprodução automática inicial')
        video.play().catch(e => console.log('❌ Erro ao iniciar autoplay:', e))
      }
    }

    const handlePlaying = () => {
      console.log('✅ Vídeo REALMENTE reproduzindo - escondendo loading definitivamente')
      setShowLoading(false)
      setIsVideoPlaying(true)
      setShowReplay(false)
      setHasEnded(false)
    }

    const handlePlay = () => {
      console.log('▶️ Vídeo iniciou reprodução')
      setShowLoading(false)
      setIsVideoPlaying(true)
      setShowReplay(false)
      setHasEnded(false)

      // Para dispositivos Apple, ativar áudio após interação do usuário
      if (isAppleDevice && userInteracted && video.muted) {
        video.muted = false
        // Volume baixo se audiodescrição estiver ativa, normal caso contrário
        video.volume = audioActive ? 0.2 : 0.7
        console.log('🔊 Áudio ativado após interação do usuário')
      }

      // Notificar componente pai
      if (onVideoStateChange) {
        onVideoStateChange({ isPlaying: true, currentTime: video.currentTime })
      }
    }

    const handlePause = () => {
      console.log('⏸️ Vídeo pausado')
      setIsVideoPlaying(false)
      // NÃO mostrar replay em pause, apenas quando terminar
      if (onVideoStateChange) {
        onVideoStateChange({ isPlaying: false, currentTime: video.currentTime })
      }
    }

    const handleEnded = () => {
      console.log('🏁 Vídeo terminou - mostrando botão replay')
      
      // Garantir que o vídeo está pausado
      video.pause()
      
      // Atualizar estados
      setIsVideoPlaying(false)
      setShowReplay(true)
      setHasEnded(true)
      
      // Notificar componente pai que o vídeo terminou
      if (onVideoStateChange) {
        onVideoStateChange({ isPlaying: false, currentTime: video.currentTime })
      }
      
      console.log('✅ Vídeo completamente parado - aguardando ação do usuário')
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100
          setLoadingProgress(percent)
        }
      }
    }

    const handleLoadStart = () => {
      console.log('⏳ Iniciando carregamento do vídeo')
      setShowLoading(true)
    }

    const handleWaiting = () => {
      console.log('⏳ Vídeo aguardando buffer')
      setShowLoading(true)
    }

    // Adicionar event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('play', handlePlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)

    // Fallback: forçar vídeo a aparecer após 2 segundos
    const fallbackTimeout = setTimeout(() => {
      console.log('⚠️ Fallback: forçando vídeo a aparecer após 2s')
      setShowLoading(false)

      // Tentar reproduzir APENAS se for a primeira vez (não terminou ainda)
      if (!hasEnded && video.paused && video.readyState >= 2 && video.currentTime === 0) {
        console.log('🎬 Fallback: iniciando reprodução inicial')
        video.play().catch(e => console.log('❌ Erro ao reproduzir no fallback:', e))
      }

      // Para iOS, ativar áudio
      if (isIOS && video.muted) {
        setTimeout(() => {
          video.muted = false
          // Volume baixo se audiodescrição estiver ativa, normal caso contrário
          video.volume = audioActive ? 0.2 : 0.7
          console.log('🔊 Áudio ativado no fallback iOS')
        }, 500)
      }
    }, 2000)

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      clearTimeout(fallbackTimeout)
    }
    }, [isAppleDevice, userInteracted, onVideoStateChange, hasEnded, audioActive])

  const handleVideoClick = () => {
    const video = videoRef.current
    if (!video) return

    // Para dispositivos Apple, ativar áudio ao clicar no vídeo
    if (isAppleDevice && video.muted) {
      video.muted = false
      // Volume baixo se audiodescrição estiver ativa, normal caso contrário
      video.volume = audioActive ? 0.2 : 0.7
      setUserInteracted(true)
      console.log('🔊 Áudio ativado ao clicar no vídeo')
    }
  }

  const handleActivateAudio = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = false
    // Volume baixo se audiodescrição estiver ativa, normal caso contrário
    video.volume = audioActive ? 0.2 : 0.7
    setUserInteracted(true)
    console.log('🔊 Áudio ativado via botão')
  }

  const handleReplay = () => {
    console.log('🔄 Botão replay clicado')
    const video = videoRef.current
    if (!video) return

    // Esconder botão de replay e resetar estado
    setShowReplay(false)
    setHasEnded(false)
    setIsVideoPlaying(true)

    // Reiniciar vídeo para o início
    video.currentTime = 0

    // Reproduzir vídeo principal
    video.play()
      .then(() => console.log('✅ Vídeo reiniciado com sucesso'))
      .catch(e => console.log('❌ Erro ao reproduzir vídeo principal:', e))

    // Notificar componente pai
    if (onVideoStateChange) {
      onVideoStateChange({ isPlaying: true, currentTime: 0 })
    }
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
                <p className="loading-percentage">{Math.round(loadingProgress)}%</p>
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
            onClick={handleVideoClick}
          >
            <source src="/ayamioja-ra/videos/anim_ayo.mp4" type="video/mp4" />
            Seu navegador não suporta vídeos HTML5.
          </video>
          
          {/* Botão Ativar Áudio - só aparece em dispositivos Apple quando áudio está mutado */}
          {isAppleDevice && !userInteracted && !showLoading && (
            <button className="activate-audio-button" onClick={handleActivateAudio}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              Ativar Áudio
            </button>
          )}

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
