import React, { useState, useRef, useEffect } from 'react'

const InterpreterVideo = ({ librasActive, videoState, customVideoSrc }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showPausedMessage, setShowPausedMessage] = useState(false)
  const videoRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const hideTimeoutRef = useRef(null)
  const lastVideoStateRef = useRef(null)

  // Determinar se estamos na HomePage (sem customVideoSrc = usar vídeos padrão)
  const isHomePage = !customVideoSrc

  // Carregar vídeo apenas quando a fonte mudar
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Se não há customVideoSrc, usar vídeos padrão da HomePage
    const videoSource = customVideoSrc || (isHomePage ? '/ayamioja-ra/videos/libras_anim_ayo.mp4' : null)
    
    if (!videoSource) return

    // Garantir que o vídeo não está em loop
    video.loop = false

    const handleCanPlay = () => {
      setIsVideoReady(true)
    }

    const handleError = (e) => {
      console.error('❌ Erro ao carregar vídeo de Libras:', e)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    
    // Carregar vídeo apenas se a fonte mudou
    if (video.src !== videoSource && video.src !== window.location.origin + videoSource) {
      video.load()
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [customVideoSrc, isHomePage])

  // Sincronização contínua com o vídeo principal
  useEffect(() => {
    const video = videoRef.current
    if (!video || !librasActive || !isVisible || !videoState?.isPlaying) {
      return
    }

    // Sincronizar currentTime continuamente para seguir o vídeo principal
    const syncInterval = setInterval(() => {
      if (video && !video.paused && videoState?.isPlaying && videoState.currentTime !== undefined) {
        // Sempre sincronizar o currentTime para seguir o vídeo principal
        // Usar uma tolerância menor para sincronização mais precisa
        const timeDiff = Math.abs(video.currentTime - videoState.currentTime)
        if (timeDiff > 0.15) {
          video.currentTime = videoState.currentTime
        }
      }
    }, 150) // Verificar a cada 150ms para sincronização mais precisa e suave

    return () => clearInterval(syncInterval)
  }, [librasActive, videoState?.isPlaying, isVisible, videoState?.currentTime])

  // Controlar play/pause e visibilidade baseado no estado do vídeo principal
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Limpar timeout anterior
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Se Libras está ativo e (há customVideoSrc OU estamos na HomePage)
    if (librasActive && (customVideoSrc || isHomePage)) {
      if (videoState?.isPlaying) {
        // Vídeo principal está reproduzindo
        setIsVisible(true)
        setShowPausedMessage(false)
        
        if (video.readyState >= 2) {
          // Sempre sincronizar currentTime quando o vídeo principal está reproduzindo
          if (videoState.currentTime !== undefined) {
            video.currentTime = videoState.currentTime
          }
          
          // Reproduzir se estiver pausado
          if (video.paused) {
            video.play().catch(e => console.log('❌ Erro ao reproduzir:', e))
          }
        }
      } else {
        // Vídeo principal está pausado
        if (!video.paused) {
          video.pause()
        }
        hideTimeoutRef.current = setTimeout(() => {
          if (!videoState?.isPlaying) {
            setIsVisible(false)
            setShowPausedMessage(false)
          }
        }, 500)
      }
    } else {
      // Libras desativado
      if (!video.paused) {
        video.pause()
      }
      setIsVisible(false)
      setShowPausedMessage(false)
    }
    
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
    }
  }, [librasActive, videoState?.isPlaying, customVideoSrc, isHomePage, videoState?.currentTime])

  return (
    <div 
      className="interpreter-container" 
      style={{ 
        position: 'fixed',
        bottom: '72px',
        left: '20px',
        width: '300px',
        height: '300px',
        zIndex: 150,
        visibility: (isVisible || showPausedMessage) ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        display: (isVisible || showPausedMessage) ? 'block' : 'none',
        background: isVisible ? '#00bcd4' : 'transparent',
        overflow: 'hidden',
        borderRadius: '10px',
        pointerEvents: (isVisible || showPausedMessage) ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        isolation: 'isolate',
        contain: 'layout style paint',
        // Garantir que não seja afetado por outras regras
        margin: 0,
        padding: 0,
        top: 'auto',
        right: 'auto'
      }}
    >
      <video 
        ref={videoRef}
        id="interpreter-libras-video"
        className="interpreter-video" 
        loop={false}
        playsInline
        muted
        preload="auto"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isVisible ? 'block' : 'none',
          visibility: isVisible ? 'visible' : 'hidden',
          opacity: isVisible ? 1 : 0,
          zIndex: 1,
          pointerEvents: 'none',
          margin: 0,
          padding: 0
        }}
      >
        {customVideoSrc ? (
          <source src={customVideoSrc} type="video/mp4" />
        ) : (
          // Se não há customVideoSrc, usar vídeos padrão (apenas na página inicial)
          <>
            <source src="/ayamioja-ra/videos/libras_anim_ayo.mp4" type="video/mp4" />
            <source src="/ayamioja-ra/videos/libras_anim_ayo_2.mp4" type="video/mp4" />
          </>
        )}
      </video>
      
    </div>
  )
}

export default InterpreterVideo
