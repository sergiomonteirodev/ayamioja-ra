import React, { useState, useRef, useEffect } from 'react'

const MainVideo = ({ librasActive, audioActive, onVideoStateChange }) => {
  const [showLoading, setShowLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const videoRef = useRef(null)
  const progressRef = useRef(0) // Ref para rastrear progresso atual
  const intervalRef = useRef(null) // Ref para o intervalo

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
      // Só atualizar se for maior (nunca resetar)
      if (100 > progressRef.current) {
        progressRef.current = 100
        setLoadingProgress(100)
      }
      setShowLoading(false)
    }

    const handleCanPlay = () => {
      console.log('✅ Vídeo pode reproduzir - escondendo loading')
      // Só atualizar se for maior (nunca resetar)
      if (100 > progressRef.current) {
        progressRef.current = 100
        setLoadingProgress(100)
      }
      setShowLoading(false)
      
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
      progressRef.current = 100
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
      // FORÇAR ocultação do loading quando vídeo realmente está reproduzindo
      setShowLoading(false)
      setIsVideoPlaying(true)
      setShowReplay(false)
      setHasEnded(false)
      // Parar intervalo se ainda estiver rodando
      if (intervalRef.current) {
        console.log('🧹 Parando intervalo - vídeo está reproduzindo')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
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

    const handleProgress = (skipUpdate = false) => {
      // Atualizar progresso baseado no buffer
      // IMPORTANTE: Só atualizar se o progresso real for MAIOR que o atual
      // Isso evita loops onde o buffer varia e causa reset do progresso
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const percent = (bufferedEnd / video.duration) * 100
        const newProgress = Math.min(Math.round(percent), 99) // Limitar a 99% até estar totalmente carregado
        
        // CRÍTICO: Só atualizar se for pelo menos 5% maior que o atual
        // Isso evita variações pequenas do buffer causarem loops
        if (newProgress >= progressRef.current + 5 || (newProgress > progressRef.current && progressRef.current < 10)) {
          progressRef.current = newProgress
          if (!skipUpdate) {
            setLoadingProgress(newProgress)
          }
          console.log(`📊 Progresso REAL (buffer): ${newProgress}%`)
          return newProgress
        }
      }
      // Retornar o progresso atual, não resetar
      return progressRef.current
    }

    const handleLoadedMetadata = () => {
      console.log('📋 Metadados do vídeo carregados')
      if (video.duration > 0) {
        console.log(`⏱️ Duração do vídeo: ${video.duration}s`)
        // Só atualizar se for maior que o atual (não resetar)
        if (15 > progressRef.current) {
          progressRef.current = 15
          setLoadingProgress(15)
          simulatedProgress = Math.max(simulatedProgress, 15) // Sincronizar
        }
      } else {
        // Só atualizar se for maior que o atual (não resetar)
        if (10 > progressRef.current) {
          progressRef.current = 10
          setLoadingProgress(10)
          simulatedProgress = Math.max(simulatedProgress, 10) // Sincronizar
        }
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
      console.log('📋 URL do vídeo:', video.src || video.currentSrc)
      console.log('📋 NetworkState:', video.networkState)
      // NÃO mostrar loading automaticamente - deixar o vídeo tentar aparecer
      // Só definir progresso inicial se for menor que 2%
      if (progressRef.current < 2) {
        progressRef.current = 2
        setLoadingProgress(2)
        simulatedProgress = 2
      }
      
      // Verificar se o vídeo está realmente tentando carregar
      setTimeout(() => {
        if (video.networkState === 3) {
          console.error('❌ NetworkState = 3 (NO_SOURCE) - vídeo não encontrou fonte')
        } else if (video.networkState === 0) {
          console.warn('⚠️ NetworkState = 0 (EMPTY) - vídeo ainda não iniciou carregamento')
        }
      }, 1000)
    }

    const handleWaiting = () => {
      console.log('⏳ Vídeo aguardando buffer')
      // NÃO reativar loading - deixar vídeo tentar continuar reproduzindo
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
    // Para Android/Chrome, verificar mais frequentemente e simular progresso gradual
    const progressCheckInterval = isAndroidChrome ? 150 : 300
    let simulatedProgress = 2 // Começar em 2% após loadstart
    let checkCount = 0
    const startTime = Date.now()
    
    console.log('🚀 Iniciando intervalo de progresso simulado', {
      interval: progressCheckInterval,
      isAndroidChrome,
      initialProgress: progressRef.current
    })
    
    // Incrementar progresso simulado gradualmente
    // IMPORTANTE: Sincronizar simulatedProgress com progressRef.current no início
    simulatedProgress = Math.max(simulatedProgress, progressRef.current)
    
    intervalRef.current = setInterval(() => {
      checkCount++
      const elapsed = Date.now() - startTime
      const progressBeforeCheck = progressRef.current
      
      // Verificar progresso REAL do buffer (sem atualizar estado)
      const realProgress = handleProgress(true) // skipUpdate = true
      
      // Sincronizar simulatedProgress se o progresso real avançou significativamente
      if (realProgress > simulatedProgress + 5) {
        simulatedProgress = realProgress
        console.log(`🔄 Sincronizando progresso simulado: ${Math.round(simulatedProgress)}%`)
      }
      
      // Incrementar progresso simulado sempre que estiver abaixo de 95%
      const currentProgress = progressRef.current
      
      // Garantir que simulatedProgress nunca seja menor que currentProgress
      simulatedProgress = Math.max(simulatedProgress, currentProgress)
      
      // SEMPRE incrementar progresso simulado se estiver abaixo de 95%
      // e o progresso real não estiver avançando rapidamente
      if (currentProgress < 95 && (currentProgress === progressBeforeCheck || realProgress <= currentProgress + 5)) {
        // Incremento baseado no tempo e dispositivo
        const timeSeconds = elapsed / 1000
        // Incremento mais agressivo para garantir que sempre avance
        const baseIncrement = isAndroidChrome ? 3 : 1.5
        const timeBasedIncrement = Math.min(timeSeconds * 0.5, 0.5) // Máximo 0.5% por segundo
        // Incremento por intervalo (ajustado pelo intervalo de verificação)
        const incrementPerInterval = (baseIncrement + timeBasedIncrement) * (progressCheckInterval / 1000)
        
        // Incrementar simulatedProgress
        simulatedProgress = simulatedProgress + incrementPerInterval
        simulatedProgress = Math.min(simulatedProgress, 95) // Limitar a 95%
        
        const newProgress = Math.round(simulatedProgress)
        
        // SEMPRE atualizar se for maior que o atual
        if (newProgress > currentProgress) {
          progressRef.current = newProgress
          setLoadingProgress(newProgress)
          // Log a cada 5 iterações para monitorar
          if (checkCount % 5 === 0) {
            console.log(`📈 Progresso SIMULADO: ${currentProgress}% → ${newProgress}% (tempo: ${Math.round(timeSeconds)}s, incremento: ${Math.round(incrementPerInterval * 100)/100}%)`)
          }
        } else if (checkCount % 20 === 0) {
          // Se não atualizou, log de diagnóstico
          console.log(`⚠️ Progresso não atualizado: current=${currentProgress}, new=${newProgress}, simulated=${Math.round(simulatedProgress * 100)/100}`)
        }
      }
      
      // FORÇAR ocultação do loading e mostrar vídeo quando estiver pronto
      if (video.readyState >= 1 && showLoading) {
        console.log('✅ Vídeo tem metadados - FORÇANDO ocultação do loading e aparecendo vídeo')
        setShowLoading(false)
        setIsVideoPlaying(true)
        // FORÇAR vídeo a aparecer
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '2', 'important')
        // Tentar reproduzir
        if (video.paused && !hasEnded) {
          video.play().catch(e => console.log('⚠️ Erro ao tentar reproduzir:', e))
        }
      }
      
      // Se progresso >= 80%, mostrar vídeo mesmo que não esteja completamente pronto
      if (currentProgress >= 80 && showLoading) {
        console.log('✅ Progresso >= 80% - FORÇANDO vídeo a aparecer')
        setShowLoading(false)
        setIsVideoPlaying(true)
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('z-index', '2', 'important')
      }
      
      // Log de diagnóstico a cada 20 verificações
      if (checkCount % 20 === 0) {
        console.log('🔍 Diagnóstico:', {
          progresso: Math.round(progressRef.current) + '%',
          real: Math.round(realProgress) + '%',
          simulado: Math.round(simulatedProgress) + '%',
          networkState: video.networkState,
          readyState: video.readyState,
          buffered: video.buffered.length,
          tempo: Math.round(elapsed/1000) + 's'
        })
      }
    }, progressCheckInterval)

    // Fallback AGRESSIVO: sempre mostrar vídeo após 2 segundos
    const fallbackDelay = 2000
    const fallbackTimeout = setTimeout(() => {
      console.log(`🚀 Fallback AGRESSIVO: forçando vídeo a aparecer após ${fallbackDelay}ms`)
      console.log('📊 Estado do vídeo:', {
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error,
        src: video.src || video.currentSrc,
        duration: video.duration
      })
      
      // SEMPRE esconder loading e mostrar vídeo após 2 segundos
      setShowLoading(false)
      setIsVideoPlaying(true)
      // FORÇAR vídeo a aparecer via DOM com !important
      video.style.setProperty('opacity', '1', 'important')
      video.style.setProperty('visibility', 'visible', 'important')
      video.style.setProperty('display', 'block', 'important')
      video.style.setProperty('z-index', '2', 'important')
      video.style.setProperty('position', 'absolute', 'important')
      
      // Tentar reproduzir
      if (!hasEnded && video.paused) {
        video.play()
          .then(() => console.log('✅ Vídeo iniciado no fallback'))
          .catch(e => console.log('⚠️ Erro ao reproduzir (vídeo ainda aparece):', e))
      }
      
      console.log('✅ Fallback: vídeo FORÇADO a aparecer')
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
      if (intervalRef.current) {
        console.log('🧹 Limpando intervalo de progresso')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      clearTimeout(fallbackTimeout)
    }
    }, [isAppleDevice, isAndroidChrome, userInteracted, onVideoStateChange, hasEnded, audioActive])

  // useEffect separado para FORÇAR ocultação do loading quando vídeo estiver pronto
  // Isso garante que mesmo se outros handlers falharem, o loading será ocultado
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Verificar periodicamente se o vídeo está pronto e forçar ocultação do loading
    const checkVideoReady = () => {
      // Se vídeo está pronto (readyState >= 3) e loading ainda está visível, FORÇAR ocultação
      if (video.readyState >= 3 && showLoading) {
        console.log('🔧 FORÇANDO ocultação do loading via useEffect (readyState >= 3)')
        setShowLoading(false)
        setIsVideoPlaying(true)
        // FORÇAR vídeo a aparecer via DOM direto
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        console.log('✅ Vídeo forçado a aparecer via DOM')
      }
      
      // Se progresso chegou a 100% e vídeo tem pelo menos metadados, forçar ocultação
      if (loadingProgress >= 100 && video.readyState >= 1 && showLoading) {
        console.log('🔧 FORÇANDO ocultação do loading via useEffect (progresso 100%)')
        setShowLoading(false)
        setIsVideoPlaying(true)
        // FORÇAR vídeo a aparecer via DOM direto
        video.style.opacity = '1'
        video.style.visibility = 'visible'
        video.style.display = 'block'
        console.log('✅ Vídeo forçado a aparecer via DOM (progresso 100%)')
      }
    }

    // Verificar imediatamente
    checkVideoReady()

    // Verificar periodicamente a cada 500ms
    const checkInterval = setInterval(checkVideoReady, 500)

    return () => {
      clearInterval(checkInterval)
    }
  }, [showLoading, loadingProgress]) // Dependências: showLoading e loadingProgress

  // useEffect adicional para garantir que vídeo seja visível quando showLoading muda
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!showLoading) {
      // Quando loading é ocultado, FORÇAR vídeo a aparecer via DOM
      console.log('🔧 showLoading mudou para false - forçando vídeo a aparecer')
      // Usar setAttribute para forçar estilos com !important
      video.style.setProperty('opacity', '1', 'important')
      video.style.setProperty('visibility', 'visible', 'important')
      video.style.setProperty('display', 'block', 'important')
      video.style.setProperty('z-index', '2', 'important')
      video.style.setProperty('position', 'absolute', 'important')
      video.style.setProperty('pointer-events', 'auto', 'important')
      console.log('✅ Vídeo forçado a aparecer quando showLoading = false (com !important)')
      console.log('📊 Estado do vídeo:', {
        opacity: window.getComputedStyle(video).opacity,
        visibility: window.getComputedStyle(video).visibility,
        display: window.getComputedStyle(video).display,
        zIndex: window.getComputedStyle(video).zIndex,
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration,
        src: video.src || video.currentSrc,
        error: video.error
      })
    }
  }, [showLoading])

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
              visibility: showLoading ? 'hidden' : 'visible',
              display: showLoading ? 'none' : 'block',
              zIndex: showLoading ? 1 : 2,
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
              position: 'absolute',
              pointerEvents: showLoading ? 'none' : 'auto'
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
