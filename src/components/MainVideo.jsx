import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const videoRef = useRef(null)

  // Caminho do vídeo usando BASE_URL do Vite (respeita base path)
  const videoPath = `${import.meta.env.BASE_URL}videos/anim_ayo.mp4`

  // Detectar mobile/Android/iOS para aplicar correções específicas
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isMobileChrome = isMobile && /Chrome/i.test(navigator.userAgent)

  // Forçar carregamento do vídeo no mount inicial - múltiplas tentativas
  useEffect(() => {
    console.log('🎬 MainVideo: Componente montado, iniciando carregamento...')
    
    let attemptCount = 0
    const maxAttempts = 15 // Aumentado para mobile
    
    const forceLoadVideo = () => {
      attemptCount++
      const video = videoRef.current
      
      if (!video) {
        if (attemptCount < maxAttempts) {
          setTimeout(forceLoadVideo, 100)
        }
        return
      }

      // Verificar se o vídeo está no DOM
      if (!document.body.contains(video)) {
        if (attemptCount < maxAttempts) {
          setTimeout(forceLoadVideo, 100)
        } else {
          console.warn('⚠️ Vídeo não encontrado no DOM após múltiplas tentativas')
        }
        return
      }

      // Verificar se source está presente
      const source = video.querySelector('source')
      if (!source || !source.src) {
        if (attemptCount < maxAttempts) {
          setTimeout(forceLoadVideo, 100)
        } else {
          console.warn('⚠️ Source tag não encontrada após múltiplas tentativas')
        }
        return
      }

      // Forçar load() para garantir que o vídeo comece a carregar imediatamente
      console.log(`🚀 [Tentativa ${attemptCount}] Forçando carregamento inicial do vídeo:`, source.src)
      
      // Garantir atributos necessários (especialmente para mobile)
      video.setAttribute('playsinline', '')
      video.playsInline = true
      
      // Atributos específicos para mobile
      if (isMobile) {
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('x5-playsinline', 'true') // Para Android/WeChat
        video.setAttribute('preload', 'metadata') // Mobile: metadata em vez de auto
        video.preload = 'metadata'
      } else {
        video.setAttribute('preload', 'auto')
        video.preload = 'auto'
      }
      
      // SEMPRE definir src diretamente no elemento video (alguns navegadores não carregam apenas com source)
      if (source.src) {
        video.src = source.src
        console.log('✅ src definido diretamente no elemento video:', source.src)
      }
      
      // Chamar load() explicitamente
      try {
        video.load()
        console.log('✅ video.load() chamado com sucesso')
        
        // Verificar se o vídeo começou a carregar
        setTimeout(() => {
          console.log('📊 Estado do vídeo após load():', {
            readyState: video.readyState,
            networkState: video.networkState,
            src: video.src || source.src,
            paused: video.paused
          })
          
          // MOBILE: Se ainda não carregou após 500ms, tentar novamente
          if (isMobile && video.readyState === 0 && attemptCount < maxAttempts) {
            console.log('📱 Mobile: Vídeo ainda não carregou, tentando novamente...')
            setTimeout(forceLoadVideo, 500)
          }
        }, 500)
      } catch (e) {
        console.error('❌ Erro ao chamar video.load():', e)
      }
    }

    // Tentar imediatamente
    forceLoadVideo()
    
    // Tentar também após pequeno delay
    const timer1 = setTimeout(forceLoadVideo, 50)
    const timer2 = setTimeout(forceLoadVideo, 200)
    const timer3 = setTimeout(forceLoadVideo, 500)
    // MOBILE: Tentativa adicional após 1 segundo
    const timer4 = isMobile ? setTimeout(forceLoadVideo, 1000) : null

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      if (timer4) clearTimeout(timer4)
    }
  }, [isMobile]) // Adicionar isMobile como dependência para mobile

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
      // Forçar visibilidade do vídeo (MOBILE: com !important)
      if (isMobile) {
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '5', 'important')
        console.log('📱 Mobile: handleLoadedData - forçando visibilidade com !important')
      }
      video.style.opacity = '1'
      video.style.visibility = 'visible'
      video.style.display = 'block'
      video.style.zIndex = '5'
    }

    const handleCanPlay = () => {
      setLoadingProgress(100)
      setShowLoading(false)
      // Forçar visibilidade do vídeo (MOBILE: com !important)
      if (isMobile) {
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '5', 'important')
        console.log('📱 Mobile: handleCanPlay - forçando visibilidade com !important')
      }
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

  // IntersectionObserver específico para mobile Chrome - força carregamento quando visível
  useEffect(() => {
    if (!isMobileChrome) return // Só para mobile Chrome
    
    const video = videoRef.current
    if (!video) return

    // Forçar carregamento quando entrar na viewport (mobile específico)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && video.readyState === 0) {
          console.log('📱 Mobile Chrome: Vídeo entrou na viewport, forçando carregamento')
          
          // Garantir atributos mobile
          video.setAttribute('webkit-playsinline', 'true')
          video.setAttribute('x5-playsinline', 'true')
          video.playsInline = true
          
          // Forçar load
          if (video.src) {
            try {
              video.load()
              console.log('✅ Mobile Chrome: load() chamado via IntersectionObserver')
            } catch (e) {
              console.error('❌ Mobile Chrome: Erro no load():', e)
            }
          }
        }
      })
    }, { threshold: 0 })

    observer.observe(video)

    return () => observer.disconnect()
  }, [isMobileChrome])

  // MOBILE: Forçar visibilidade AGGRESSIVA - executar quando vídeo tiver metadados
  useEffect(() => {
    if (!isMobile) return
    
    const video = videoRef.current
    if (!video) return

    const forceMobileVisibility = () => {
      // Se vídeo tem metadados (readyState >= 1), FORÇAR visibilidade IMEDIATAMENTE
      if (video.readyState >= 1) {
        setShowLoading(false)
        // Forçar com !important via setProperty (sobrescreve tudo)
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '5', 'important')
        // Também definir via style normal
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
        console.log('📱 Mobile AGGRESSIVE: Forçando visibilidade (readyState >= 1)')
      }
    }

    // Verificar imediatamente
    forceMobileVisibility()

    // Listener para quando vídeo carregar metadados
    const handleMetadata = () => {
      console.log('📱 Mobile: Metadata carregado, forçando visibilidade')
      forceMobileVisibility()
    }

    video.addEventListener('loadedmetadata', handleMetadata, { once: true })

    // Verificar a cada 100ms (muito agressivo para mobile)
    const interval = setInterval(forceMobileVisibility, 100)

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata)
      clearInterval(interval)
    }
  }, [isMobile])

  // Listener de touch para mobile - força carregamento na primeira interação
  useEffect(() => {
    if (!isMobile) return

    const handleFirstTouch = () => {
      const video = videoRef.current
      if (!video || video.readyState > 0) return
      
      console.log('👆 Mobile: Touch detectado, forçando carregamento do vídeo')
      
      // Garantir atributos mobile
      video.setAttribute('webkit-playsinline', 'true')
      video.setAttribute('x5-playsinline', 'true')
      video.playsInline = true
      
      if (video.src) {
        try {
          video.load()
          console.log('✅ Mobile: load() chamado via touch')
        } catch (e) {
          console.error('❌ Mobile: Erro no load() via touch:', e)
        }
      }
    }

    // Usar once para remover automaticamente após primeira interação
    document.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true })
    document.addEventListener('touchend', handleFirstTouch, { once: true, passive: true })

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch)
      document.removeEventListener('touchend', handleFirstTouch)
    }
  }, [isMobile])

  // MutationObserver + IntersectionObserver para garantir que vídeo carregue
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // MutationObserver para detectar quando vídeo é inserido no DOM
    const mutationObserver = new MutationObserver((mutations, observer) => {
      const video = videoRef.current
      if (!video) return

      // Verificar se vídeo está no DOM e tem source
      if (document.body.contains(video)) {
        const source = video.querySelector('source')
        if (source && source.src && video.readyState === 0) {
          console.log('🔍 MutationObserver detectou vídeo no DOM, forçando carregamento')
          if (!video.src) {
            video.src = source.src
          }
          
          // Garantir atributos mobile se necessário
          if (isMobile) {
            video.setAttribute('webkit-playsinline', 'true')
            video.setAttribute('x5-playsinline', 'true')
          }
          
          try {
            video.load()
            console.log('✅ load() chamado via MutationObserver')
            observer.disconnect() // Desconectar após primeira detecção
          } catch (e) {
            console.error('❌ Erro ao chamar load() via MutationObserver:', e)
          }
        }
      }
    })

    // Observar mudanças no DOM
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Criar IntersectionObserver para detectar quando vídeo está visível
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('👁️ Vídeo está visível, forçando carregamento')
            const v = entry.target
            const source = v.querySelector('source')
            if (v.readyState === 0 && v.networkState === 0) {
              // Vídeo ainda não começou a carregar
              if (source && source.src && !v.src) {
                v.src = source.src
              }
              
              // Garantir atributos mobile se necessário
              if (isMobile) {
                v.setAttribute('webkit-playsinline', 'true')
                v.setAttribute('x5-playsinline', 'true')
              }
              
              try {
                v.load()
                console.log('✅ load() chamado via IntersectionObserver')
              } catch (e) {
                console.error('❌ Erro ao chamar load() via IntersectionObserver:', e)
              }
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    intersectionObserver.observe(video)

    // Também tentar quando a página estiver completamente carregada
    const handleWindowLoad = () => {
      console.log('📄 Window load event - forçando carregamento do vídeo')
      const v = videoRef.current
      if (!v) return
      
      const source = v.querySelector('source')
      if (v.readyState === 0) {
        if (source && source.src && !v.src) {
          v.src = source.src
        }
        try {
          v.load()
          console.log('✅ load() chamado via window.load')
        } catch (e) {
          console.error('❌ Erro ao chamar load() via window.load:', e)
        }
      }
    }

    // Verificar se já está carregado
    if (document.readyState === 'complete') {
      handleWindowLoad()
    } else {
      window.addEventListener('load', handleWindowLoad)
    }

    return () => {
      mutationObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('load', handleWindowLoad)
    }
  }, [isMobile])

  // Forçar visibilidade do vídeo periodicamente quando estiver pronto - MOBILE AGGRESSIVE
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const checkAndForceVisibility = () => {
      // MOBILE: Forçar visibilidade IMEDIATA quando vídeo tiver metadados
      if (isMobile && video.readyState >= 1) {
        setShowLoading(false)
        // Forçar estilos diretamente com !important via setProperty
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '5', 'important')
        // Também definir via style normal
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
        console.log('📱 Mobile: Forçando visibilidade AGGRESSIVA do vídeo (readyState >= 1)')
      }
      
      // Desktop: comportamento normal
      if (!isMobile && video.readyState >= 1 && showLoading) {
        setShowLoading(false)
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
        console.log('✅ Forçando visibilidade do vídeo (readyState >= 1)')
      }
      
      // Se vídeo pode reproduzir, garantir visibilidade SEMPRE
      if (video.readyState >= 2) {
        setShowLoading(false)
        if (isMobile) {
          video.style.setProperty('opacity', '1', 'important')
          video.style.setProperty('visibility', 'visible', 'important')
          video.style.setProperty('display', 'block', 'important')
          video.style.setProperty('z-index', '5', 'important')
        }
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        video.style.zIndex = '5'
      }
    }

    // Verificar imediatamente
    checkAndForceVisibility()

    // MOBILE: Verificar mais frequentemente (a cada 100ms)
    // Desktop: a cada 300ms
    const interval = setInterval(checkAndForceVisibility, isMobile ? 100 : 300)

    return () => {
      clearInterval(interval)
    }
  }, [showLoading, isMobile])

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
            src={videoPath}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            preload={isMobile ? "metadata" : "auto"}
            loop={false}
            style={{
              opacity: isMobile ? 1 : (showLoading ? 0 : 1), // MOBILE: sempre 1
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
