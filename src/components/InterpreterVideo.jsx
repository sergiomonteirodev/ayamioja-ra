import React, { useState, useRef, useEffect } from 'react'

const InterpreterVideo = ({ librasActive, videoState, customVideoSrc }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showPausedMessage, setShowPausedMessage] = useState(false)
  const videoRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  // Carregar e preparar o vídeo quando o componente montar ou quando customVideoSrc mudar
  useEffect(() => {
    console.log('🎭 InterpreterVideo: Componente montado, customVideoSrc:', customVideoSrc)
    const video = videoRef.current
    
    if (!video) {
      console.log('❌ InterpreterVideo: videoRef.current é null no mount')
      return
    }

    // Resetar estado quando o vídeo mudar
    setIsVideoReady(false)
    setIsVisible(false)

    console.log('✅ InterpreterVideo: videoRef disponível, iniciando carregamento')

    const handleCanPlay = () => {
      console.log('✅ Vídeo de Libras pronto para reproduzir')
      setIsVideoReady(true)
    }

    const handleLoadedData = () => {
      console.log('✅ Vídeo de Libras - dados carregados')
      setIsVideoReady(true)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)
    
    console.log('⏳ Forçando carregamento do vídeo de Libras...')
    video.load() // Forçar carregamento

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [customVideoSrc]) // Continua dependendo de customVideoSrc para recarregar quando mudar

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      console.log('❌ InterpreterVideo: Vídeo ref não disponível')
      return
    }

    console.log('🎬 InterpreterVideo - librasActive:', librasActive, 'videoState:', videoState, 'isVideoReady:', isVideoReady, 'customVideoSrc:', customVideoSrc)

    if (!isVideoReady) {
      console.log('⏳ InterpreterVideo: Vídeo ainda não está pronto, aguardando...')
      return
    }

    // Se Libras está ativo (com ou sem vídeo customizado)
    if (librasActive) {
      // Vídeo principal está reproduzindo
      if (videoState?.isPlaying) {
        console.log('✅ Mostrando vídeo de Libras - videoState.currentTime:', videoState.currentTime)
        setIsVisible(true)
        setShowPausedMessage(false)
        
        // Sincronizar com o vídeo principal apenas se houver diferença significativa
        const timeDiff = Math.abs(video.currentTime - videoState.currentTime)
        if (timeDiff > 0.5) {
          console.log('🔄 Sincronizando Libras - diff:', timeDiff.toFixed(2), 's')
          video.currentTime = videoState.currentTime
        }
        
        // Reproduzir vídeo de Libras
        if (video.paused) {
          console.log('▶️ Reproduzindo vídeo de Libras')
          video.play()
            .then(() => console.log('✅ Vídeo de Libras reproduzindo'))
            .catch(e => console.log('❌ Erro ao reproduzir vídeo de libras:', e))
        }
      } else {
        // Vídeo principal pausado/terminou - ESCONDER vídeo de Libras
        console.log('⏸️ Vídeo principal pausado - escondendo vídeo de Libras')
        video.pause()
        setIsVisible(false) // Esconder completamente
        setShowPausedMessage(false) // Não mostrar mensagem
      }
    } else {
      // Libras desativado
      console.log('❌ Escondendo vídeo de Libras (toggle desativado)')
      video.pause()
      setIsVisible(false)
      setShowPausedMessage(false)
    }
  }, [librasActive, videoState, isVideoReady, customVideoSrc])

  return (
    <div 
      className="interpreter-container" 
      style={{ 
        visibility: (isVisible || showPausedMessage) ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: (isVisible || showPausedMessage) ? 'auto' : 'none'
      }}
    >
      <video 
        ref={videoRef}
        className="interpreter-video" 
        loop={false}
        playsInline
        muted
        preload="auto"
        style={{ display: 'block' }}
      >
        {customVideoSrc ? (
          <source src={customVideoSrc} type="video/mp4" />
        ) : (
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
