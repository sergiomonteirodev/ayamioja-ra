import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const MainVideo = ({
  librasActive,
  audioActive,
  onVideoStateChange,
  bonequinhaTime = 8,
  onPauseForAD,
  resumeFrom,
  resumeTrigger,
  onResumed,
  onVideoReset,
  onVideoEnded,
  adPhase,
  videoSrc,
  storageKey = 'homepageVideoStarted',
  resetWhenPathname,
  canShowReplay = true,
  trackSrc,
  trackLang = 'pt-BR',
  trackLabel = 'Português',
  captionOutside = false,
  showPauseOnInteract = false
}) => {
  const [showLoading, setShowLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showReplay, setShowReplay] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const hasEndedRef = useRef(false) // Ref para evitar problemas de closure no iOS
  const [waitingBonequinha, setWaitingBonequinha] = useState(false)
  const [captionText, setCaptionText] = useState('')
  const [videoIsPlaying, setVideoIsPlaying] = useState(false)
  const [pointerOverVideo, setPointerOverVideo] = useState(false)
  const pointerHideTimeoutRef = useRef(null)
  const location = useLocation()
  
  // Verificar se o vídeo já foi iniciado pelo usuário nesta sessão
  const hasVideoBeenStarted = () => {
    try {
      return sessionStorage.getItem(storageKey) === 'true'
    } catch (e) {
      return false
    }
  }
  
  const [showPlayButton, setShowPlayButton] = useState(!hasVideoBeenStarted())
  const videoRef = useRef(null)
  const bonequinhaTimeupdateHandlerRef = useRef(null)
  
  // Resetar vídeo quando voltar para a página (home ou ouvirlivro)
  useEffect(() => {
    const isHome = location.pathname === '/'
    const isResetPage = resetWhenPathname ? location.pathname === resetWhenPathname : false
    if (!isHome && !isResetPage) {
      return
    }
    
    const video = videoRef.current
    if (!video) {
      try {
        sessionStorage.removeItem(storageKey)
      } catch (e) {
        console.warn('⚠️ Não foi possível limpar sessionStorage:', e)
      }
      setShowPlayButton(true)
      return
    }
    
    console.log('🔄 Voltando para página do vídeo - resetando')
    
    if (!video.paused) {
      video.pause()
    }
    
    video.currentTime = 0
    
    try {
      sessionStorage.removeItem(storageKey)
    } catch (e) {
      console.warn('⚠️ Não foi possível limpar sessionStorage:', e)
    }
    
    setShowPlayButton(true)
    setShowReplay(false)
    setHasEnded(false)
    hasEndedRef.current = false // Reset ref também
    setWaitingBonequinha(false)
    setPointerOverVideo(false)
    if (pointerHideTimeoutRef.current) {
      clearTimeout(pointerHideTimeoutRef.current)
      pointerHideTimeoutRef.current = null
    }
    const handler = bonequinhaTimeupdateHandlerRef.current
    if (handler && video) {
      video.removeEventListener('timeupdate', handler)
      bonequinhaTimeupdateHandlerRef.current = null
    }
    onVideoReset?.()
    
    console.log('✅ Vídeo resetado - botão de play aparecerá')
  }, [location.pathname, onVideoReset, storageKey, resetWhenPathname])

  // Caminho do vídeo (prop ou padrão anim_ayo)
  const videoPath = videoSrc || `${import.meta.env.BASE_URL}videos/anim_ayo.mp4`

  // Legenda fora do vídeo: usar TextTrack em modo hidden e exibir texto em div abaixo do círculo
  const captionTrackCleanupRef = useRef(null)
  useEffect(() => {
    if (!trackSrc || !captionOutside) return
    const video = videoRef.current
    if (!video) return

    const applyTrack = () => {
      const tracks = video.textTracks
      if (!tracks || tracks.length === 0) return
      const track = tracks[0]
      track.mode = 'hidden'
      const onCueChange = () => {
        let text = ''
        if (track.activeCues && track.activeCues.length > 0) {
          for (let i = 0; i < track.activeCues.length; i++) {
            text += (track.activeCues[i].text || '') + '\n'
          }
          text = text.trim()
        }
        setCaptionText(text)
      }
      track.addEventListener('cuechange', onCueChange)
      captionTrackCleanupRef.current = () => {
        track.removeEventListener('cuechange', onCueChange)
        captionTrackCleanupRef.current = null
      }
    }

    if (video.textTracks && video.textTracks.length > 0) {
      applyTrack()
      return () => { if (captionTrackCleanupRef.current) captionTrackCleanupRef.current() }
    }
    const onLoadedMetadata = () => applyTrack()
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      if (captionTrackCleanupRef.current) captionTrackCleanupRef.current()
    }
  }, [trackSrc, captionOutside])

  // Detectar mobile e iOS
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  // Função auxiliar para converter networkState em texto
  const networkStateText = (state) => {
    switch (state) {
      case 0: return 'NETWORK_EMPTY - Ainda não iniciou'
      case 1: return 'NETWORK_IDLE - Ativo e selecionou recurso'
      case 2: return 'NETWORK_LOADING - Está baixando'
      case 3: return 'NETWORK_NO_SOURCE - Nenhum src encontrado'
      default: return `Desconhecido: ${state}`
    }
  }

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

  // AD ativado com vídeo já rodando: pausar no ponto atual (sem seek para bonequinha).
  useEffect(() => {
    if (!audioActive) {
      setWaitingBonequinha(false)
      return
    }
    const video = videoRef.current
    if (!video || !onPauseForAD) return
    if (adPhase === 'playing_ad') return

    if (!video.paused && !video.ended && !waitingBonequinha) {
      const resumeAt = video.currentTime
      video.pause()
      onPauseForAD(resumeAt)
    }
  }, [audioActive, adPhase, onPauseForAD, waitingBonequinha])

  // Retomar vídeo após fim da audiodescrição.
  useEffect(() => {
    const video = videoRef.current
    if (!video || resumeTrigger == null || resumeFrom == null || !onResumed) return

    video.currentTime = resumeFrom
    video.play().catch(() => {})
    onResumed()
  }, [resumeTrigger, resumeFrom, onResumed])

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

    const handlePlay = () => {
      // Não ocultar botão aqui - só quando usuário clicar
      updateVideoState()
    }
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

    // Android: Iniciar muted para garantir autoplay funciona
    // Estratégia: Iniciar muted e habilitar áudio após 1 segundo de reprodução
    // Isso permite que o vídeo apareça e reproduza na primeira vez
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      video.muted = true
      video.setAttribute('muted', 'true')
      console.log('🔇 Android: Vídeo iniciado muted para garantir autoplay')
      
      let audioEnableTimer = null
      let hasEnabledAudio = false
      
      // Habilitar áudio após 1 segundo de reprodução
      const enableAudioAfter1Second = () => {
        if (hasEnabledAudio) return
        hasEnabledAudio = true
        
        if (audioEnableTimer) {
          clearTimeout(audioEnableTimer)
        }
        
        // Verificar se o vídeo está tocando e tem pelo menos 1 segundo
        if (!video.paused && video.currentTime >= 0.5) {
          video.muted = false
          video.removeAttribute('muted')
          console.log('🔊 Android: Áudio habilitado após 1 segundo de reprodução (currentTime:', video.currentTime.toFixed(2), 's)')
        } else {
          // Se ainda não passou 1 segundo, esperar mais um pouco
          audioEnableTimer = setTimeout(() => {
            if (!video.paused && !hasEnabledAudio) {
              video.muted = false
              video.removeAttribute('muted')
              console.log('🔊 Android: Áudio habilitado após timeout de 1 segundo')
              hasEnabledAudio = true
            }
          }, 1000)
        }
      }
      
      // Monitorar quando o vídeo começar a tocar
      const handlePlayStart = () => {
        console.log('▶️ Android: Vídeo começou a tocar - agendando enable audio em 1s')
        // Aguardar 1 segundo após o play começar
        audioEnableTimer = setTimeout(enableAudioAfter1Second, 1000)
      }
      
      // Monitorar timeupdate para habilitar após 1 segundo de reprodução
      const handleTimeUpdate = () => {
        if (!hasEnabledAudio && !video.paused && video.currentTime >= 1.0) {
          enableAudioAfter1Second()
          // Remover listener após habilitar áudio
          video.removeEventListener('timeupdate', handleTimeUpdate)
          video._androidTimeUpdateHandler = null
        }
      }
      
      // Guardar referência para cleanup
      video._androidTimeUpdateHandler = handleTimeUpdate
      
      video.addEventListener('play', handlePlayStart, { once: true })
      video.addEventListener('timeupdate', handleTimeUpdate)
      
      // Se já estiver tocando, iniciar timer imediatamente
      if (!video.paused) {
        handlePlayStart()
      }
      
      // Guardar referência do timer para cleanup
      video._androidAudioTimer = audioEnableTimer
    } else {
      // Desktop/iOS: Pode tentar iniciar com áudio
      video.muted = false
      video.removeAttribute('muted')
      console.log('🔊 MainVideo: Áudio habilitado - muted:', video.muted)
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
    // Android precisa de mais tentativas
    const forceLoadVideo = () => {
      try {
        // Garantir atributos Android antes de load()
        if (isMobile) {
          video.setAttribute('playsinline', '')
          video.setAttribute('webkit-playsinline', 'true')
          video.setAttribute('x5-playsinline', 'true')
          video.playsInline = true
        }
        
        video.load()
        console.log('✅ MainVideo: video.load() chamado no mount', {
          readyState: video.readyState,
          networkState: video.networkState,
          isAndroid: /Android/i.test(navigator.userAgent)
        })
      } catch (e) {
        console.error('❌ MainVideo: Erro ao chamar video.load():', e)
      }
    }
    
    forceLoadVideo()
    
    // Android: tentar novamente se não começou a carregar
    if (/Android/i.test(navigator.userAgent)) {
      setTimeout(() => {
        if (video.networkState === 0 || video.readyState === 0) {
          console.log('🔄 Android: Retry load() após 200ms')
          forceLoadVideo()
        }
      }, 200)
      
      setTimeout(() => {
        if (video.networkState === 0 || video.readyState === 0) {
          console.log('🔄 Android: Retry load() após 600ms')
          forceLoadVideo()
        }
      }, 600)
    }
    
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

    // Cleanup dos listeners de áudio Android
    return () => {
      clearInterval(forceVisibilityInterval)
      
      // Limpar timer e listeners de áudio Android se ainda existirem
      if (isAndroid) {
        const video = videoRef.current
        if (video) {
          // Limpar timer
          if (video._androidAudioTimer) {
            clearTimeout(video._androidAudioTimer)
            video._androidAudioTimer = null
          }
          // Remover listener de timeupdate
          const timeUpdateHandler = video._androidTimeUpdateHandler
          if (timeUpdateHandler) {
            video.removeEventListener('timeupdate', timeUpdateHandler)
            video._androidTimeUpdateHandler = null
          }
        }
      }
    }
  }, [videoPath])

  // Event listeners simples para loading
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      console.log('✅ MainVideo: canplay event - vídeo pode reproduzir')
      setShowLoading(false)
      
      // Não ocultar botão aqui - só quando usuário clicar
      
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
          height: video.offsetHeight,
          paused: video.paused,
          readyState: video.readyState
        })
        
        // Android: Manter muted para autoplay funcionar, depois habilitar áudio
        const isAndroid = /Android/i.test(navigator.userAgent)
        if (!isAndroid) {
          // Desktop/iOS: Pode tentar com áudio
          video.muted = false
          video.removeAttribute('muted')
        }
        // Android mantém muted aqui - será habilitado após play
        
        // Função para tentar reproduzir (com retries para Android)
        const attemptPlay = (attempt = 0) => {
          if (video.paused && video.readyState >= 2) {
            video.play().then(() => {
              console.log('✅ MainVideo: Play iniciado com sucesso', { attempt })
              // Android: Habilitar áudio após play bem-sucedido
              if (isAndroid && video.muted) {
                video.muted = false
                video.removeAttribute('muted')
                console.log('🔊 Android: Áudio habilitado após play bem-sucedido')
              } else if (!isAndroid) {
                // Garantir novamente após play (alguns navegadores podem resetar)
                video.muted = false
                console.log('🔊 MainVideo: Áudio confirmado após play - muted:', video.muted)
              }
            }).catch((err) => {
              console.warn('⚠️ MainVideo: Play bloqueado:', err, { attempt })
              // Android: Tentar novamente até 3 vezes
              if (isAndroid && attempt < 3) {
                setTimeout(() => {
                  attemptPlay(attempt + 1)
                }, 300 * (attempt + 1)) // Delay crescente: 300ms, 600ms, 900ms
              }
            })
          } else if (video.paused && isAndroid && attempt < 3) {
            // Se ainda não tem dados suficientes, tentar novamente
            setTimeout(() => {
              attemptPlay(attempt + 1)
            }, 500)
          } else if (!video.paused) {
            // Se já está tocando, garantir áudio (Android)
            if (isAndroid && video.muted) {
              video.muted = false
              video.removeAttribute('muted')
              console.log('🔊 Android: Áudio habilitado (vídeo já estava tocando)')
            }
          }
        }
        
        // Não tentar reproduzir automaticamente - esperar clique no botão
        // attemptPlay() // DESABILITADO - vídeo será iniciado pelo botão de play
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
          height: video.offsetHeight,
          paused: video.paused,
          readyState: video.readyState
        })
        
        // REMOVIDO: Play automático após loadeddata
        // O vídeo só deve tocar quando o botão de play for clicado
      }
    }

    const handleEnded = () => {
      if (hasEndedRef.current) return // Evitar chamadas duplicadas
      hasEndedRef.current = true
      setShowReplay(true)
      setHasEnded(true)
      onVideoEnded?.()
    }

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const percent = Math.min((bufferedEnd / video.duration) * 100, 99)
        setLoadingProgress(Math.round(percent))
      }
    }

    // iOS FALLBACK: Verificar se vídeo terminou via timeupdate ou ended property
    const handleTimeUpdate = () => {
      if (hasEndedRef.current) return // Já detectou fim
      
      // Verificar se video.ended é true OU se currentTime está muito próximo do final
      const isAtEnd = video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.3)
      
      if (isAtEnd) {
        hasEndedRef.current = true
        setShowReplay(true)
        setHasEnded(true)
        onVideoEnded?.()
      }
    }

    const handleError = (e) => {
      const error = video.error
      let errorMessage = 'Erro desconhecido'
      
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Download abortado pelo usuário'
            break
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Erro de rede ao tentar baixar o vídeo'
            break
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Erro ao decodificar o vídeo'
            break
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Formato de vídeo não suportado ou src não encontrado'
            break
          default:
            errorMessage = 'Erro desconhecido'
        }
      }
      
      console.error('❌ MainVideo: Erro ao carregar vídeo:', {
        error,
        code: error?.code,
        message: errorMessage,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
        currentSrc: video.currentSrc
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
        
        // REMOVIDO: Play automático após loadedmetadata
        // O vídeo só deve tocar quando o botão de play for clicado
      }
    }

    const handlePlay = () => setVideoIsPlaying(true)
    const handlePause = () => setVideoIsPlaying(false)

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    // iOS FALLBACK: Adicionar timeupdate para detectar fim do vídeo
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [onVideoEnded])

  const handlePlayButtonClick = () => {
    const video = videoRef.current
    if (!video) return
    
    console.log('▶️ Botão de play clicado - iniciando vídeo', { audioActive })
    
    // Marcar que o vídeo foi iniciado pelo usuário (persistir na sessão)
    try {
      sessionStorage.setItem(storageKey, 'true')
    } catch (e) {
      console.warn('⚠️ Não foi possível salvar no sessionStorage:', e)
    }
    
    setShowPlayButton(false)
    let didAddBonequinhaListener = false

    if (audioActive && onPauseForAD) {
      setWaitingBonequinha(true)
      const handler = () => {
        if (video.currentTime >= bonequinhaTime) {
          video.removeEventListener('timeupdate', handler)
          bonequinhaTimeupdateHandlerRef.current = null
          const resumeAt = video.currentTime
          video.pause()
          video.currentTime = bonequinhaTime
          onPauseForAD(resumeAt)
          setWaitingBonequinha(false)
        }
      }
      video.addEventListener('timeupdate', handler)
      bonequinhaTimeupdateHandlerRef.current = handler
      didAddBonequinhaListener = true
    }
    
    // Garantir que o áudio está habilitado antes de tocar
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      // Android: Iniciar muted e habilitar após 1 segundo
      video.muted = true
      video.setAttribute('muted', 'true')
      
      // Habilitar áudio após 1 segundo
      setTimeout(() => {
        video.muted = false
        video.removeAttribute('muted')
        console.log('🔊 Android: Áudio habilitado após 1 segundo')
      }, 1000)
    } else {
      video.muted = false
      video.removeAttribute('muted')
    }
    
    // Iniciar reprodução
    video.play().then(() => {
      console.log('✅ Vídeo iniciado pelo botão de play')
    }).catch((err) => {
      console.error('❌ Erro ao iniciar vídeo:', err)
      setWaitingBonequinha(false)
      if (didAddBonequinhaListener && bonequinhaTimeupdateHandlerRef.current) {
        video.removeEventListener('timeupdate', bonequinhaTimeupdateHandlerRef.current)
        bonequinhaTimeupdateHandlerRef.current = null
      }
      try {
        sessionStorage.removeItem(storageKey)
      } catch (e) {}
      setShowPlayButton(true)
    })
  }

  const handleReplay = () => {
    const video = videoRef.current
    if (!video) return

    onVideoReset?.()
    setShowReplay(false)
    setHasEnded(false)
    hasEndedRef.current = false // Reset ref também
    video.currentTime = 0

    const prev = bonequinhaTimeupdateHandlerRef.current
    if (prev) {
      video.removeEventListener('timeupdate', prev)
      bonequinhaTimeupdateHandlerRef.current = null
    }

    if (audioActive && onPauseForAD) {
      setWaitingBonequinha(true)
      const handler = () => {
        if (video.currentTime >= bonequinhaTime) {
          video.removeEventListener('timeupdate', handler)
          bonequinhaTimeupdateHandlerRef.current = null
          const resumeAt = video.currentTime
          video.pause()
          video.currentTime = bonequinhaTime
          onPauseForAD(resumeAt)
          setWaitingBonequinha(false)
        }
      }
      video.addEventListener('timeupdate', handler)
      bonequinhaTimeupdateHandlerRef.current = handler
    }

    video.play().catch(() => {})
  }

  const showPlayBtn = showPlayButton || (showPauseOnInteract && !videoIsPlaying && !hasEnded)
  const showPauseBtn = showPauseOnInteract && videoIsPlaying && pointerOverVideo

  const handleVideoAreaMouseEnter = () => {
    if (pointerHideTimeoutRef.current) {
      clearTimeout(pointerHideTimeoutRef.current)
      pointerHideTimeoutRef.current = null
    }
    setPointerOverVideo(true)
  }
  const handleVideoAreaMouseLeave = () => {
    setPointerOverVideo(false)
  }
  const handleVideoAreaTouchStart = () => {
    if (pointerHideTimeoutRef.current) {
      clearTimeout(pointerHideTimeoutRef.current)
    }
    setPointerOverVideo(true)
  }
  const handleVideoAreaTouchEnd = () => {
    pointerHideTimeoutRef.current = setTimeout(() => setPointerOverVideo(false), 2500)
  }

  const handlePauseClick = () => {
    const video = videoRef.current
    if (video && !video.paused) video.pause()
  }

  return (
    <section className="circle-section">
      <div className="circular-text-container">
        <div
          className="main-circle"
          {...(showPauseOnInteract && videoIsPlaying ? {
            onMouseEnter: handleVideoAreaMouseEnter,
            onMouseLeave: handleVideoAreaMouseLeave,
            onTouchStart: handleVideoAreaTouchStart,
            onTouchEnd: handleVideoAreaTouchEnd
          } : {})}
        >
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
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src={videoPath} type="video/mp4" />
            {trackSrc && (
              <track
                kind="subtitles"
                src={trackSrc}
                srcLang={trackLang}
                label={trackLabel}
                default
              />
            )}
            Seu navegador não suporta vídeos HTML5.
          </video>

          {/* Botão de Play (inicial ou após pause) */}
          {showPlayBtn && (
            <button 
              className="play-button" 
              onClick={handlePlayButtonClick}
              style={{
                zIndex: 25,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                padding: 0,
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
              }}
            >
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="#333"
                style={{
                  marginLeft: '4px' // Ajustar seta para parecer mais centralizada
                }}
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          )}

          {/* Botão de Pause (mesmo estilo e posição, só ao interagir com o vídeo) */}
          {showPauseBtn && (
            <button 
              type="button"
              className="play-button pause-button"
              onClick={handlePauseClick}
              style={{
                zIndex: 25,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                padding: 0,
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#333">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
          )}

          {/* Botão Assistir Novamente - só quando permitido (ex.: após Libras terminar) */}
          {showReplay && hasEnded && canShowReplay && (
            <button 
              className="replay-button" 
              onClick={handleReplay}
              style={{
                zIndex: 20,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                visibility: 'visible',
                opacity: 1
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v3h4v4h-4v3z"/>
              </svg>
              Assistir Novamente
            </button>
          )}
        </div>
      </div>
      {captionOutside && trackSrc && (
        <div className="caption-outside" aria-live="polite">
          {captionText}
        </div>
      )}
    </section>
  )
}

export default MainVideo
