import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const videoRef = useRef(null)

  // Detectar dispositivos e navegadores
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isAppleDevice = isIOS || isSafari
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
  const isAndroidChrome = isAndroid && isChrome

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
      // Sempre enviar o estado atual, mesmo quando pausado
      onVideoStateChange({ 
        isPlaying: !video.paused && !video.ended, 
        currentTime: video.currentTime 
      })
    }

    // Atualizar a cada 100ms para sincronização precisa
    const interval = setInterval(updateVideoState, 100)

    // Também atualizar em eventos importantes
    const handlePlay = () => updateVideoState()
    const handlePause = () => updateVideoState()
    const handleTimeUpdate = () => updateVideoState()
    const handleEnded = () => updateVideoState()

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      clearInterval(interval)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onVideoStateChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Configurações específicas para Android/Chrome
    if (isAndroidChrome) {
      console.log('📱 Android/Chrome detectado - aplicando otimizações')
      try {
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
      } catch (e) {
        console.warn('⚠️ Erro ao definir playsinline:', e)
      }
      video.playsInline = true
    }

    // FORÇAR CARREGAMENTO IMEDIATO DO VÍDEO
    // Para Android, verificar networkState antes de chamar load()
    const shouldLoad = !isAndroidChrome || video.networkState === 0 || video.networkState === 3 || video.readyState === 0
    if (shouldLoad) {
      console.log('🚀 Forçando carregamento imediato do vídeo', {
        networkState: video.networkState,
        readyState: video.readyState,
        isAndroidChrome
      })
      try {
        video.load()
      } catch (e) {
        console.warn('⚠️ Erro ao chamar video.load():', e)
      }
    } else {
      console.log('⏳ Vídeo já está carregando, pulando load()', {
        networkState: video.networkState,
        readyState: video.readyState
      })
    }

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
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Autoplay iniciado com sucesso')
            })
            .catch(e => {
              console.log('❌ Erro ao iniciar autoplay:', e)
              // Para Android/Chrome, tentar novamente após um delay
              if (isAndroidChrome) {
                setTimeout(() => {
                  console.log('🔄 Tentando autoplay novamente no Android/Chrome')
                  video.play().catch(err => console.log('❌ Erro no retry:', err))
                }, 500)
              }
            })
        }
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
      // Atualizar progresso baseado no buffer
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0 && !isNaN(duration)) {
          const percent = (bufferedEnd / duration) * 100
          setLoadingProgress(Math.min(percent, 99)) // Limitar a 99% até estar totalmente carregado
          console.log(`📊 Progresso: ${Math.round(percent)}%`)
        }
      } else if (video.readyState >= 1) {
        // Se temos metadados mas ainda não há buffer, mostrar pelo menos 5%
        setLoadingProgress(5)
      }
    }

    const handleLoadedMetadata = () => {
      console.log('📋 Metadados do vídeo carregados')
      if (video.duration > 0) {
        console.log(`⏱️ Duração do vídeo: ${video.duration}s`)
        setLoadingProgress(10) // Mostrar 10% quando metadados carregarem
      }
    }

    const handleError = (e) => {
      console.error('❌ Erro ao carregar vídeo:', e)
      console.error('Código de erro:', video.error?.code)
      console.error('Mensagem:', video.error?.message)
      console.error('URL do vídeo:', video.src || video.currentSrc)
      console.error('NetworkState:', video.networkState)
      console.error('ReadyState:', video.readyState)
      
      // Para Android/Chrome, tentar recarregar mais agressivamente
      const retryDelay = isAndroidChrome ? 1000 : 2000
      const maxRetries = isAndroidChrome ? 3 : 2
      
      let retryCount = 0
      const retryLoad = () => {
        retryCount++
        if (retryCount <= maxRetries) {
          console.log(`🔄 Tentando recarregar vídeo após erro (tentativa ${retryCount}/${maxRetries})`)
          setTimeout(() => {
            try {
              video.load()
            } catch (err) {
              console.error('❌ Erro ao recarregar:', err)
              if (retryCount < maxRetries) {
                retryLoad()
              }
            }
          }, retryDelay)
        } else {
          console.error('❌ Máximo de tentativas de recarregamento atingido')
        }
      }
      
      retryLoad()
    }

    const handleLoadStart = () => {
      console.log('⏳ Iniciando carregamento do vídeo')
      setShowLoading(true)
      setLoadingProgress(1) // Mostrar 1% quando iniciar
    }

    const handleWaiting = () => {
      console.log('⏳ Vídeo aguardando buffer')
      setShowLoading(true)
    }

    // Adicionar event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('play', handlePlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('error', handleError)
    
    // Verificar progresso periodicamente mesmo sem eventos
    const progressInterval = setInterval(() => {
      handleProgress()
    }, 500) // Verificar a cada 500ms

    // Fallback melhorado: forçar vídeo a aparecer mais rápido
    // Para Android/Chrome, usar timeout mais longo devido a latência de rede
    const fallbackDelay = isAndroidChrome ? 3000 : 2000
    const fallbackTimeout = setTimeout(() => {
      console.log(`⚠️ Fallback: forçando vídeo a aparecer após ${fallbackDelay}ms`)
      console.log('📊 Estado do vídeo:', {
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error,
        src: video.src || video.currentSrc,
        duration: video.duration,
        isAndroidChrome
      })

      // Garantir que o vídeo está visível mesmo se ainda não carregou completamente
      if (video.readyState >= 1) { // HAVE_METADATA - pelo menos metadados carregados
        // Esconder loading e tentar reproduzir
        setShowLoading(false)
        // Tentar reproduzir APENAS se for a primeira vez (não terminou ainda)
        if (!hasEnded && video.paused && video.currentTime === 0) {
          console.log('🎬 Fallback: iniciando reprodução inicial')
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Reprodução iniciada no fallback')
              })
              .catch(e => {
                console.log('❌ Erro ao reproduzir no fallback:', e)
                // Para Android/Chrome, tentar novamente
                if (isAndroidChrome) {
                  setTimeout(() => {
                    console.log('🔄 Retry de reprodução no Android/Chrome')
                    video.play().catch(err => {
                      console.log('❌ Erro no retry:', err)
                      setShowLoading(true)
                    })
                  }, 500)
                } else {
                  setShowLoading(true)
                }
              })
          }
        }
      } else {
        // Se ainda não tem metadados, forçar load novamente
        console.log('🔄 Fallback: forçando load novamente - readyState:', video.readyState)
        try {
          video.load()
        } catch (e) {
          console.error('❌ Erro ao chamar load() no fallback:', e)
        }
        // Aguardar mais um pouco antes de esconder loading
        const retryDelay = isAndroidChrome ? 1500 : 1000
        setTimeout(() => {
          if (video.readyState >= 1) {
            setShowLoading(false)
            if (!hasEnded && video.paused && video.currentTime === 0) {
              video.play().catch(e => console.log('❌ Erro ao reproduzir após segundo load:', e))
            }
          } else {
            // Se ainda não carregou, mostrar vídeo mesmo assim no Android/Chrome
            if (isAndroidChrome) {
              console.log('⚠️ Android/Chrome: mostrando vídeo mesmo sem metadados completos')
              setShowLoading(false)
            }
          }
        }, retryDelay)
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
    }, fallbackDelay)

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('error', handleError)
      clearInterval(progressInterval)
      clearTimeout(fallbackTimeout)
    }
    }, [isAppleDevice, isAndroidChrome, userInteracted, onVideoStateChange, hasEnded, audioActive])

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
            style={{ 
              opacity: showLoading ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
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
