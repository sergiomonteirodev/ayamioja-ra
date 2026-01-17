import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const videoRef = useRef(null)

  // Caminho do vídeo usando BASE_URL do Vite (respeita base path)
  const videoPath = `${import.meta.env.BASE_URL}videos/anim_ayo.mp4`

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

    const handleLoadedData = () => {
      setShowLoading(false)
    }

    const handleCanPlay = () => {
      setShowLoading(false)
      // Tentar autoplay apenas uma vez
      if (video.paused && !hasEnded) {
        video.play().catch(() => {
          // Ignorar erro de autoplay - usuário precisará interagir
        })
      }
    }

    const handlePlay = () => {
      setShowLoading(false)
    }

    const handleEnded = () => {
      setShowReplay(true)
      setHasEnded(true)
    }

    const handleError = () => {
      console.error('❌ Erro ao carregar vídeo')
      setShowLoading(false)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [hasEnded])

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
