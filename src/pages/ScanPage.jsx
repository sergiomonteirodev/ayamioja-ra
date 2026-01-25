import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
// import InterpreterVideo from '../components/InterpreterVideo' // DESATIVADO - vídeo de libras desativado
import SafeImage from '../components/SafeImage'
import AudioDescriptionAR from '../components/AudioDescriptionAR'

const ScanPage = () => {
  const [librasActive, setLibrasActive] = useState(true) // ✅ Iniciar com Libras ativado
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [activeTargetIndex, setActiveTargetIndex] = useState(null)
  const [arVideoStates, setArVideoStates] = useState({})
  const [isArReady, setIsArReady] = useState(false)
  const [showScanningAnimation, setShowScanningAnimation] = useState(true)
  // const [currentLibrasVideo, setCurrentLibrasVideo] = useState(null) // DESATIVADO - vídeo de libras desativado
  const [deviceOrientation, setDeviceOrientation] = useState('portrait') // 'portrait' ou 'landscape'
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false) // Controla se a permissão da câmera foi concedida
  const [isRequestingPermission, setIsRequestingPermission] = useState(false) // Controla se está solicitando permissão
  
  const sceneRef = useRef(null)
  const rendererCheckIntervalRef = useRef(null)
  const rafIdRef = useRef(null)
  const initialCameraCheckRef = useRef(null)
  const initialCameraTimeoutRef = useRef(null)
  const ensureCameraVideoVisibleRef = useRef(null)
  const cameraOverlayRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const mindarStartedRef = useRef(false)
  const transparencyIntervalRef = useRef(null)
  const blackElementObserverRef = useRef(null)
  // REMOVIDO: Deixar o MindAR gerenciar completamente o vídeo da câmera
  // Não precisamos fazer nada - o MindAR gerencia tudo

  const navigate = useNavigate()

  const handleLibrasToggle = (active) => {
    setLibrasActive(active)
    console.log('Toggle Libras:', active)
  }

  const handleAudioToggle = (active) => {
    setAudioActive(active)
    console.log('Toggle Audio:', active)
  }

  // REMOVIDO: updateCanvasVisibility - deixar MindAR gerenciar canvas completamente
  // O canvas deve sempre estar transparente e visível, sem manipulações condicionais

  const handleBackClick = () => {
    // Garantir que a URL tenha a barra no final para carregar o background corretamente
    const baseUrl = window.location.origin
    window.location.href = `${baseUrl}/ayamioja-ra/`
  }

  const startMindAR = async () => {
    if (mindarStartedRef.current) {
      console.log('▶️ MindAR já está em execução')
      return
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    for (let attempt = 0; attempt < 30; attempt++) {
      const scene = sceneRef.current
      if (!scene) {
        await wait(100)
        continue
      }

      if (!scene.hasLoaded) {
        await new Promise((resolve) => {
          scene.addEventListener('loaded', resolve, { once: true })
        })
      }

      const component = scene.components && scene.components['mindar-image']
      const system = scene.systems && scene.systems['mindar-image-system']

      if (component && system) {
        if (!component.ui) {
          component.ui = {
            showLoading: () => {},
            hideLoading: () => {},
            showScanning: () => {},
            hideScanning: () => {},
            showError: () => {},
            hideError: () => {}
          }
        }

        const startFn = (typeof component.start === 'function')
          ? component.start.bind(component)
          : (typeof system.start === 'function' ? system.start.bind(system) : null)

        if (!startFn) {
          throw new Error('MindAR não expôs um método de inicialização.')
        }

        await startFn()
        mindarStartedRef.current = true
        console.log('🚀 MindAR iniciado manualmente após a permissão')
        return
      }

      await wait(200)
    }

    throw new Error('MindAR não ficou pronto para iniciar.')
  }

  // Função para solicitar permissão da câmera antes de iniciar a cena
  const requestCameraPermission = async () => {
    console.log('📷 requestCameraPermission chamado:', { isRequestingPermission, cameraPermissionGranted })
    
    if (isRequestingPermission) {
      console.log('⚠️ Já está solicitando permissão, ignorando...')
      return
    }
    
    if (cameraPermissionGranted) {
      console.log('✅ Permissão já concedida, ignorando...')
      return
    }
    
    setIsRequestingPermission(true)
    console.log('📷 Solicitando permissão da câmera...')
    
    // Timeout de segurança para garantir que o botão não trave
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout na solicitação de permissão - reabilitando botão')
      setIsRequestingPermission(false)
    }, 10000) // Reduzido para 10 segundos
    
    try {
      // Verificar se estamos em localhost ou HTTPS
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '[::1]'
      const isSecure = window.location.protocol === 'https:' || isLocalhost
      
      console.log('🔍 Verificando ambiente:', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isLocalhost,
        isSecure,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
      })
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não está disponível neste navegador. Tente usar um navegador moderno (Chrome, Firefox, Edge).')
      }
      
      // REMOVIDO: Não solicitar stream manualmente - deixar o MindAR fazer isso
      // O MindAR precisa gerenciar completamente o stream da câmera
      console.log('✅ Permissão da câmera concedida - MindAR irá solicitar o stream')
      
      // Adicionar timeout para startMindAR para evitar travamento
      const mindarTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao iniciar MindAR')), 15000)
      })
      
      await Promise.race([startMindAR(), mindarTimeout])

      setCameraPermissionGranted(true)
      
      // REMOVIDO: Deixar o MindAR gerenciar completamente o vídeo da câmera
      
      // Garantir que o canvas seja transparente (apenas CSS, sem WebGL)
      if (sceneRef.current) {
        const scene = sceneRef.current
        const canvas = scene.querySelector('canvas')
        if (canvas) {
          canvas.style.setProperty('background-color', 'transparent', 'important')
          canvas.style.setProperty('background', 'transparent', 'important')
          canvas.style.setProperty('opacity', '1', 'important')
          console.log('✅ Canvas CSS configurado para transparência após permissão')
        }
      }
      
      console.log('✅ Permissão concedida. MindAR iniciado, aguardando vídeo aparecer...')
      
      clearTimeout(timeoutId)
      setIsRequestingPermission(false)
    } catch (error) {
      clearTimeout(timeoutId)
      setIsRequestingPermission(false)
      console.error('❌ Erro ao solicitar permissão da câmera:', error)
      console.error('  - Nome do erro:', error.name)
      console.error('  - Mensagem:', error.message)
      console.error('  - Tipo:', error.constructor.name)
      
      // Mensagens mais específicas baseadas no tipo de erro
      let errorMessage = 'Não foi possível acessar a câmera.'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = `Permissão da câmera negada.\n\nPara permitir:\n1. Clique no ícone de cadeado/câmera na barra de endereços\n2. Selecione "Permitir" para câmera\n3. Recarregue a página\n\nOu vá em Configurações do navegador > Privacidade > Permissões do site > Câmera`
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada. Verifique se há uma câmera conectada ao dispositivo.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'A câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'As configurações da câmera solicitadas não estão disponíveis. Verifique se há outra câmera conectada ou tente reduzir a resolução nas configurações do dispositivo.'
      } else {
        errorMessage = `Erro ao acessar a câmera: ${error.message || error.name}. Verifique as permissões do navegador.`
      }
      
      alert(errorMessage)
    } finally {
      clearTimeout(timeoutId)
      setIsRequestingPermission(false)
      console.log('✅ Botão reabilitado após solicitação de permissão')
    }
  }

  // Resetar estado de solicitação de permissão se ficar travado
  useEffect(() => {
    // Se o botão estiver travado por mais de 15 segundos, resetar
    if (isRequestingPermission) {
      const resetTimeout = setTimeout(() => {
        console.warn('⚠️ Resetando estado de solicitação de permissão (timeout de segurança)')
        setIsRequestingPermission(false)
      }, 15000) // 15 segundos
      
      return () => clearTimeout(resetTimeout)
    }
  }, [isRequestingPermission])

  // Detectar orientação do dispositivo (apenas para referência, sem ajustar vídeos)
  useEffect(() => {
    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      const newOrientation = isPortrait ? 'portrait' : 'landscape'
      setDeviceOrientation(newOrientation)
      console.log('📱 Orientação do dispositivo:', newOrientation)
    }
    
    // Verificar orientação inicial
    updateOrientation()
    
    // Ouvir mudanças de orientação (apenas para tracking, não para ajustar vídeos)
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateOrientation, 300)
    })
    
    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  // Controlar visibilidade da animação de scanning baseado em targets ativos
  useEffect(() => {
    if (activeTargetIndex !== null) {
      console.log('🎯 Target ativo detectado - ESCONDENDO animação')
      setShowScanningAnimation(false)
    } else {
      console.log('👁️ Nenhum target ativo - MOSTRANDO animação')
      setShowScanningAnimation(true)
    }
  }, [activeTargetIndex])

  // Atualizar videoState continuamente enquanto um vídeo AR está reproduzindo
  // Necessário para sincronizar a audiodescrição com os vídeos AR
  useEffect(() => {
    if (activeTargetIndex === null) {
      // Nenhum target ativo - pausar estado do vídeo
      setVideoState({
        isPlaying: false,
        currentTime: 0
      })
      return
    }

    const videoId = `video${activeTargetIndex + 1}`
    const video = document.getElementById(videoId)
    
    if (!video) {
      console.warn(`⚠️ Vídeo ${videoId} não encontrado para target ${activeTargetIndex}`)
      return
    }

    const updateVideoState = () => {
      if (video) {
        const isPlaying = !video.paused && !video.ended
        setVideoState({
          isPlaying: isPlaying,
          currentTime: video.currentTime
        })
      }
    }

    // Atualizar imediatamente
    updateVideoState()

    // Atualizar a cada 100ms para manter sincronização com a audiodescrição
    const interval = setInterval(updateVideoState, 100)

    // Adicionar listeners para eventos do vídeo
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
  }, [activeTargetIndex])

  // Controlar volume dos vídeos AR quando audiodescrição está ativa
  useEffect(() => {
    // Controlar volume de todos os vídeos AR que têm áudio (video1, video2 e video3)
    const video1 = document.getElementById('video1')
    const video2 = document.getElementById('video2')
    const video3 = document.getElementById('video3')

    if (audioActive) {
      // Audiodescrição ativa: reduzir volume dos vídeos para priorizar a voz da AD
      // Deixar vídeos bem mais baixos (20%) para a AD se sobressair
      if (video1) {
        console.log('🔊 Audiodescrição ativa - reduzindo volume do video1 (anim_4) para 0.2')
        video1.volume = 0.2
      }
      if (video2) {
        console.log('🔊 Audiodescrição ativa - reduzindo volume do video2 para 0.3')
        video2.volume = 0.3
      }
      if (video3) {
        console.log('🔊 Audiodescrição ativa - reduzindo volume do video3 para 0.3')
        video3.volume = 0.3
      }
    } else {
      // Audiodescrição inativa: restaurar volume dos vídeos para 1.0 (100%)
      if (video1) {
        console.log('🔊 Audiodescrição inativa - restaurando volume do video1 (anim_4) para 1.0')
        video1.volume = 1.0
      }
      if (video2) {
        console.log('🔊 Audiodescrição inativa - restaurando volume do video2 para 1.0')
        video2.volume = 1.0
      }
      if (video3) {
        console.log('🔊 Audiodescrição inativa - restaurando volume do video3 para 1.0')
        video3.volume = 1.0
      }
    }
  }, [audioActive])

  // MindAR + A-Frame gerenciam AR (como backup). Só layout: scan-page-active para CSS.
  useEffect(() => {
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')

    const scene = sceneRef.current
    if (!scene) {
      console.log('❌ Scene ref não encontrada')
      return
    }
    
    // Detectar Android
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isLowPowerDevice = /Android.*(?:ARM|arm|ARMv7|armv7)/i.test(navigator.userAgent)
    
    // Obter referências aos vídeos
    const videos = [
      document.getElementById('video1'),
      document.getElementById('video2'),
      document.getElementById('video3')
    ]

    // Função para garantir que o src do vídeo está disponível
    const ensureVideoSourceAvailable = async (video) => {
      try {
        const src = video.getAttribute('src') || video.src
        if (!src) throw new Error('src vazio')
        const response = await fetch(src, { method: 'HEAD', cache: 'no-store' })
        if (!response.ok) {
          console.warn(`⚠️ ${src} retornou ${response.status}`)
          // Não usar fallback, apenas logar
        }
      } catch (e) {
        console.warn(`⚠️ Falha ao verificar vídeo (${video.id}):`, e)
      }
    }

    // Pré-carregar vídeos de forma agressiva (especialmente para Android)
    const preloadVideos = () => {
      videos.forEach((video, index) => {
        if (!video) return
        
        // Forçar atributos inline para Android
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        video.playsInline = true
        
        // Todos os vídeos AR podem ter áudio quando forem reproduzidos
        video.muted = false
        
        // Forçar load() para iniciar download APENAS se não estiver carregando
        // networkState: 0=EMPTY, 1=IDLE, 2=LOADING, 3=NO_SOURCE
        if (video.readyState === 0 && video.networkState !== 2) {
          console.log(`🔄 Pré-carregando vídeo ${video.id}...`)
          try {
            video.load()
          } catch(e) {
            console.warn(`⚠️ Erro ao pré-carregar ${video.id}:`, e)
          }
        } else if (video.networkState === 2) {
          console.log(`⏳ Vídeo ${video.id} já está carregando, pulando load()`)
        }
        
        // Adicionar listeners para monitorar progresso
        video.addEventListener('loadeddata', () => {
          console.log(`✅ ${video.id} carregado (readyState: ${video.readyState})`)
        }, { once: true })
        
        video.addEventListener('error', (e) => {
          const error = video.error
          if (error) {
            let errorMsg = 'Erro desconhecido'
            switch (error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMsg = 'Download abortado'
                break
              case MediaError.MEDIA_ERR_NETWORK:
                errorMsg = 'Erro de rede'
                break
              case MediaError.MEDIA_ERR_DECODE:
                errorMsg = 'Erro ao decodificar (codec não suportado ou arquivo corrompido)'
                break
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Formato não suportado'
                break
            }
            console.error(`❌ Erro ao carregar ${video.id}:`, {
              code: error.code,
              message: errorMsg,
              errorMessage: error.message,
              src: video.src,
              currentSrc: video.currentSrc,
              readyState: video.readyState,
              networkState: video.networkState
            })
            
            // Sugestão para resolver o problema
            if (error.code === MediaError.MEDIA_ERR_DECODE) {
              console.warn(`💡 SOLUÇÃO: O vídeo ${video.id} não pode ser decodificado. Possíveis causas:`)
              console.warn(`   - Codec não suportado pelo navegador`)
              console.warn(`   - Arquivo de vídeo corrompido`)
              console.warn(`   - Formato não compatível`)
              console.warn(`   - Solução: Converter o vídeo para H.264 (AVC) em MP4`)
              console.warn(`   - Comando sugerido: ffmpeg -i ${video.src} -c:v libx264 -c:a aac -movflags +faststart output.mp4`)
            }
          } else {
            console.error(`❌ Erro ao carregar ${video.id}:`, e)
          }
        }, { once: true })
      })
    }

    // Função para ativar vídeo com retry específico para Android
    const enableVideo = (video, retryCount = 0) => {
      console.log(`🎥 Tentando reproduzir vídeo: ${video.id} (tentativa ${retryCount + 1})`)
      
      // Garantir configurações inline
      try {
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
      } catch {}
      video.playsInline = true
      
      // Todos os vídeos AR podem ter áudio quando forem reproduzidos
      video.muted = false
      
      // Para Android: sempre forçar load() antes de play() APENAS se não estiver carregando
      // networkState: 0=EMPTY, 1=IDLE, 2=LOADING, 3=NO_SOURCE
      const mustLoad = (isAndroid || video.readyState === 0 || video.networkState === 3) && video.networkState !== 2
      if (mustLoad) {
        console.log(`📦 Chamando load() no vídeo: ${video.id} (networkState: ${video.networkState}, readyState: ${video.readyState})`)
        try { 
          video.load() 
        } catch(e) { 
          console.warn("load() falhou", e) 
        }
      } else if (video.networkState === 2) {
        console.log(`⏳ Vídeo ${video.id} já está carregando, pulando load()`)
      }
      
      // Tenta tocar com retry
      const tryPlay = () => {
        return video.play().then(() => {
          console.log(`✅ Vídeo reproduzindo: ${video.id} (readyState: ${video.readyState})`)
          return true
        }).catch((e) => {
          console.warn(`❌ Erro ao reproduzir vídeo: ${video.id}`, e)
          
          // Retry para Android (até 3 tentativas)
          if (isAndroid && retryCount < 3) {
            console.log(`🔄 Tentando novamente em 500ms... (retry ${retryCount + 1}/3)`)
            setTimeout(() => {
              enableVideo(video, retryCount + 1)
            }, 500)
          }
          return false
        })
      }
      
      if (video.readyState < 2) { // < HAVE_CURRENT_DATA
        const canplayOnce = () => {
          video.removeEventListener('canplay', canplayOnce)
          tryPlay()
        }
        video.addEventListener('canplay', canplayOnce, {once: true})
        // fallback timeout aumentado para Android
        setTimeout(tryPlay, isAndroid ? 2500 : 1500)
      } else {
        tryPlay()
      }
    }

    console.log("🚀 Pré-carregando vídeos AR...")
    preloadVideos()

    let userInteracted = false
    const handleFirstInteraction = async () => {
      if (!cameraPermissionGranted) return
      if (userInteracted) return
      userInteracted = true
      document.body.removeEventListener('click', handleFirstInteraction)
      console.log('👆 Primeira interação – habilitando vídeos (estilo backup)')
      for (const video of videos) {
        if (!video) continue
        await ensureVideoSourceAvailable(video)
        // Força load antes do play para evitar NS_BINDING_ABORTED
        try { 
          if (video.readyState === 0) {
            video.load() 
          }
        } catch(e) {
          console.warn(`⚠️ Erro ao carregar ${video.id}:`, e)
        }
        // Todos os vídeos AR podem ter áudio quando forem reproduzidos
        video.muted = false
        // Para evitar áudio antes do target: só toca video1 e video2 quando seus targets forem encontrados
        // video3 só toca quando target 2 for encontrado
        if (video.id !== 'video3') {
          enableVideo(video)
        }
      }
    }

    document.body.addEventListener('click', handleFirstInteraction, { once: true })

    const handleSceneLoaded = () => {
        console.log('✅ Scene A-Frame carregada')
        preloadVideos()
        setTimeout(() => {
        console.log('🔍 Configurando listeners de targets...')
        
        const target0 = document.getElementById('target0')
        const target1 = document.getElementById('target1')
        const target2 = document.getElementById('target2')
        
        console.log('Targets encontrados:', { target0: !!target0, target1: !!target1, target2: !!target2 })
        
        // Verificar se os targets têm os atributos corretos
        if (target0) {
          console.log('Target0 atributos:', {
            hasMindarTarget: target0.hasAttribute('mindar-image-target'),
            targetIndex: target0.getAttribute('mindar-image-target'),
            id: target0.id
          })
        }
        if (target1) {
          console.log('Target1 atributos:', {
            hasMindarTarget: target1.hasAttribute('mindar-image-target'),
            targetIndex: target1.getAttribute('mindar-image-target'),
            id: target1.id
          })
        }
        if (target2) {
          console.log('Target2 atributos:', {
            hasMindarTarget: target2.hasAttribute('mindar-image-target'),
            targetIndex: target2.getAttribute('mindar-image-target'),
            id: target2.id
          })
        }
        
        // Verificar se o MindAR está ativo e rastreando
        const sceneElement = document.querySelector('a-scene')
        if (sceneElement && sceneElement.systems) {
          const mindarSystem = sceneElement.systems.mindar || 
                              sceneElement.systems['mindar-image-system'] ||
                              sceneElement.systems['mindar-image']
          
          if (mindarSystem) {
            console.log('✅ Sistema MindAR encontrado ao configurar listeners:', {
              isTracking: mindarSystem.isTracking,
              isReady: mindarSystem.isReady,
              hasTracker: !!mindarSystem.tracker,
              trackerState: mindarSystem.tracker?.state || 'unknown'
            })
          } else {
            console.warn('⚠️ Sistema MindAR não encontrado ao configurar listeners. Sistemas disponíveis:', Object.keys(sceneElement.systems || {}))
          }
        }
        
        // Verificar se os targets têm os atributos corretos
        if (target0) {
          console.log('Target0 atributos:', {
            hasMindarTarget: target0.hasAttribute('mindar-image-target'),
            targetIndex: target0.getAttribute('mindar-image-target'),
            id: target0.id
          })
        }
        if (target1) {
          console.log('Target1 atributos:', {
            hasMindarTarget: target1.hasAttribute('mindar-image-target'),
            targetIndex: target1.getAttribute('mindar-image-target'),
            id: target1.id
          })
        }
        if (target2) {
          console.log('Target2 atributos:', {
            hasMindarTarget: target2.hasAttribute('mindar-image-target'),
            targetIndex: target2.getAttribute('mindar-image-target'),
            id: target2.id
          })
        }
        
        // Verificar se o MindAR está ativo (mas NÃO iniciar aqui - deixar o arReady fazer isso)
        // Usar sceneElement que já foi declarado acima
        if (sceneElement && sceneElement.systems) {
          // Tentar diferentes nomes de sistema do MindAR
          const mindarSystem = sceneElement.systems.mindar || 
                              sceneElement.systems['mindar-image-system'] ||
                              sceneElement.systems['mindar-image']
          
          if (mindarSystem) {
            console.log('✅ Sistema MindAR encontrado:', {
              isTracking: mindarSystem.isTracking,
              isReady: mindarSystem.isReady,
              hasTracker: !!mindarSystem.tracker,
              systemName: mindarSystem.constructor?.name || 'unknown'
            })
            
            // NÃO iniciar aqui - o arReady event já faz isso
            // Apenas verificar o estado
          } else {
            console.warn('⚠️ Sistema MindAR não encontrado. Sistemas disponíveis:', Object.keys(sceneElement.systems || {}))
          }
        } else {
          console.warn('⚠️ Scene ou systems não encontrados')
        }
        
        // Target 0 - Habilitar vídeo quando target for encontrado
        if (target0) {
          target0.addEventListener('targetFound', async () => {
            console.log('🎯 Target 0 encontrado!')
            setActiveTargetIndex(0)
            setShowScanningAnimation(false)
            
            // Habilitar e reproduzir o vídeo AR (continuando de onde parou)
            const video = document.getElementById('video1')
            if (video) {
              const savedTime = video.currentTime
              console.log('🎥 Habilitando vídeo AR para target 0:', video.id, 'continuando de:', savedTime.toFixed(2), 's')
              try {
                await ensureVideoSourceAvailable(video)
                // Só chamar load() se o vídeo realmente não foi carregado ainda
                if (video.readyState === 0) {
                  video.load()
                }
                // Target 0 (video1/anim_4.mp4) deve ter áudio habilitado
                video.muted = false
                video.setAttribute('muted', 'false')
                // enableVideo vai dar play() mantendo o currentTime atual (continua de onde parou)
                enableVideo(video)
                console.log('▶️ Vídeo continuando de:', video.currentTime.toFixed(2), 's')
                
                // Garantir que o a-video esteja visível e configurado corretamente
                const videoPlane = target0.querySelector('a-video')
                if (videoPlane) {
                  // CRÍTICO: Garantir que o a-video esteja visível
                  videoPlane.setAttribute('visible', 'true')
                  
                  // Garantir que o material está configurado corretamente
                  const currentMaterial = videoPlane.getAttribute('material')
                  if (!currentMaterial || !currentMaterial.includes('shader: flat')) {
                    videoPlane.setAttribute('material', 'shader: flat; side: double; transparent: false; opacity: 1.0')
                  }
                  
                  // Garantir que o vídeo HTML está tocando
                  console.log('📹 Estado do vídeo HTML:', {
                    id: video.id,
                    paused: video.paused,
                    readyState: video.readyState,
                    currentTime: video.currentTime,
                    duration: video.duration,
                    muted: video.muted
                  })
                  
                  // Verificar se o a-video está realmente visível no DOM
                  setTimeout(() => {
                    const isVisible = videoPlane.getAttribute('visible')
                    const material = videoPlane.getAttribute('material')
                    const object3D = videoPlane.object3D
                    console.log('🔍 Verificação do a-video após 500ms:', {
                      visible: isVisible,
                      material: material,
                      object3DExists: !!object3D,
                      object3DVisible: object3D?.visible,
                      object3DMatrixWorld: object3D?.matrixWorld?.elements
                    })
                  }, 500)
                  
                  console.log('✅ a-video do target 0 tornado visível e configurado', {
                    visible: videoPlane.getAttribute('visible'),
                    material: videoPlane.getAttribute('material')
                  })
                } else {
                  console.warn('⚠️ a-video do target 0 não encontrado!')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 0:', e)
              }
            }
          })
          
          target0.addEventListener('targetLost', () => {
            console.log('❌ Target 0 perdido - pausando vídeo (mantendo posição)')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            // Pausar vídeo com múltiplas tentativas para garantir (SEM resetar currentTime)
            const pauseVideo = (video, attempts = 0) => {
              if (!video) return
              
              if (attempts < 5) {
                video.pause()
                if (!video.paused) {
                  setTimeout(() => pauseVideo(video, attempts + 1), 100)
                } else {
                  // NÃO resetar currentTime - manter posição para continuar de onde parou
                  console.log('✅ Vídeo 1 pausado (posição mantida:', video.currentTime, 's)')
                }
              }
            }
            
            const video = document.getElementById('video1')
            pauseVideo(video)
            
            // Garantir que o a-video esteja oculto
            const videoPlane = target0.querySelector('a-video')
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'false')
              console.log('✅ a-video do target 0 oculto')
            }
            // A audiodescrição será pausada automaticamente via AudioDescriptionAR quando videoState.isPlaying for false
          })
        }

        // Target 1 - Habilitar vídeo quando target for encontrado
        if (target1) {
          target1.addEventListener('targetFound', async () => {
            console.log('🎯 Target 1 encontrado!')
            setActiveTargetIndex(1)
            setShowScanningAnimation(false)
            
            // Habilitar e reproduzir o vídeo AR
            const video = document.getElementById('video2')
            if (video) {
              console.log('🎥 Habilitando vídeo AR para target 1:', video.id)
              try {
                await ensureVideoSourceAvailable(video)
                if (video.readyState === 0) {
                  video.load()
                }
                // video2 deve ter áudio (não mutar)
                video.muted = false
                video.setAttribute('muted', 'false')
                console.log('🔊 Áudio do video2 habilitado - muted:', video.muted)
                enableVideo(video)
                
                // Garantir que o a-video esteja visível e configurado corretamente
                const videoPlane = target1.querySelector('a-video')
                if (videoPlane) {
                  // CRÍTICO: Garantir que o a-video esteja visível
                  videoPlane.setAttribute('visible', 'true')
                  
                  // Garantir que o material está configurado corretamente
                  const currentMaterial = videoPlane.getAttribute('material')
                  if (!currentMaterial || !currentMaterial.includes('shader: flat')) {
                    videoPlane.setAttribute('material', 'shader: flat; side: double; transparent: false; opacity: 1.0')
                  }
                  
                  // Garantir que o vídeo HTML está tocando
                  console.log('📹 Estado do vídeo HTML:', {
                    id: video.id,
                    paused: video.paused,
                    readyState: video.readyState,
                    currentTime: video.currentTime,
                    duration: video.duration,
                    muted: video.muted
                  })
                  
                  // Verificar se o a-video está realmente visível no DOM
                  setTimeout(() => {
                    const isVisible = videoPlane.getAttribute('visible')
                    const material = videoPlane.getAttribute('material')
                    const object3D = videoPlane.object3D
                    console.log('🔍 Verificação do a-video após 500ms:', {
                      visible: isVisible,
                      material: material,
                      object3DExists: !!object3D,
                      object3DVisible: object3D?.visible,
                      object3DMatrixWorld: object3D?.matrixWorld?.elements
                    })
                  }, 500)
                  
                  console.log('✅ a-video do target 1 tornado visível e configurado', {
                    visible: videoPlane.getAttribute('visible'),
                    material: videoPlane.getAttribute('material')
                  })
                } else {
                  console.warn('⚠️ a-video do target 1 não encontrado!')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 1:', e)
              }
            }
          })
          
          target1.addEventListener('targetLost', () => {
            console.log('❌ Target 1 perdido - pausando vídeo')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            // Pausar vídeo com múltiplas tentativas para garantir
            const pauseVideo = (video, attempts = 0) => {
              if (!video) return
              
              if (attempts < 5) {
                video.pause()
                if (!video.paused) {
                  setTimeout(() => pauseVideo(video, attempts + 1), 100)
                } else {
                  video.currentTime = 0 // Resetar para início apenas quando pausar
                  console.log('✅ Vídeo 2 pausado e resetado')
                }
              }
            }
            
            const video = document.getElementById('video2')
            pauseVideo(video)
            
            // Garantir que o a-video esteja oculto
            const videoPlane = target1.querySelector('a-video')
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'false')
              console.log('✅ a-video do target 1 oculto')
            }
          })
        }

        // Target 2 - Habilitar vídeo quando target for encontrado
        if (target2) {
          target2.addEventListener('targetFound', async () => {
            console.log('🎯 Target 2 encontrado!')
            setActiveTargetIndex(2)
            setShowScanningAnimation(false)
            
            // Habilitar e reproduzir o vídeo AR (com áudio)
            const video = document.getElementById('video3')
            if (video) {
              console.log('🎥 Habilitando vídeo AR para target 2:', video.id)
              try {
                await ensureVideoSourceAvailable(video)
                if (video.readyState === 0) {
                  video.load()
                }
                video.muted = false // video3 deve ter áudio
                enableVideo(video)
                
                // Garantir que o a-video esteja visível e configurado corretamente
                const videoPlane = target2.querySelector('a-video')
                if (videoPlane) {
                  // CRÍTICO: Garantir que o a-video esteja visível
                  videoPlane.setAttribute('visible', 'true')
                  
                  // Garantir que o material está configurado corretamente
                  const currentMaterial = videoPlane.getAttribute('material')
                  if (!currentMaterial || !currentMaterial.includes('shader: flat')) {
                    videoPlane.setAttribute('material', 'shader: flat; side: double; transparent: false; opacity: 1.0')
                  }
                  
                  // Garantir que o vídeo HTML está tocando
                  console.log('📹 Estado do vídeo HTML:', {
                    id: video.id,
                    paused: video.paused,
                    readyState: video.readyState,
                    currentTime: video.currentTime,
                    duration: video.duration,
                    muted: video.muted
                  })
                  
                  // Verificar se o a-video está realmente visível no DOM
                  setTimeout(() => {
                    const isVisible = videoPlane.getAttribute('visible')
                    const material = videoPlane.getAttribute('material')
                    const object3D = videoPlane.object3D
                    console.log('🔍 Verificação do a-video após 500ms:', {
                      visible: isVisible,
                      material: material,
                      object3DExists: !!object3D,
                      object3DVisible: object3D?.visible,
                      object3DMatrixWorld: object3D?.matrixWorld?.elements
                    })
                  }, 500)
                  
                  console.log('✅ a-video do target 2 tornado visível e configurado', {
                    visible: videoPlane.getAttribute('visible'),
                    material: videoPlane.getAttribute('material')
                  })
                } else {
                  console.warn('⚠️ a-video do target 2 não encontrado!')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 2:', e)
              }
            }
          })
          
          target2.addEventListener('targetLost', () => {
            console.log('❌ Target 2 perdido - pausando vídeo')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            // Pausar vídeo com múltiplas tentativas para garantir
            const pauseVideo = (video, attempts = 0) => {
              if (!video) return
              
              if (attempts < 5) {
                video.pause()
                if (!video.paused) {
                  setTimeout(() => pauseVideo(video, attempts + 1), 100)
                } else {
                  video.currentTime = 0 // Resetar para início apenas quando pausar
                  console.log('✅ Vídeo 3 pausado e resetado')
                }
              }
            }
            
            const video = document.getElementById('video3')
            pauseVideo(video)
            
            // Garantir que o a-video esteja oculto
            const videoPlane = target2.querySelector('a-video')
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'false')
              console.log('✅ a-video do target 2 oculto')
            }
          })
        }
      }, 2000)
    }
    
    const handleArReady = () => {
      console.log('✅ MindAR pronto')
      setIsArReady(true)
    }

    scene.addEventListener('loaded', handleSceneLoaded)
    scene.addEventListener('arReady', handleArReady)
    

    return () => {
      document.body.classList.remove('scan-page-active')
      document.documentElement.classList.remove('scan-page-active')
      const s = sceneRef.current
      if (s) {
        s.removeEventListener('loaded', handleSceneLoaded)
        s.removeEventListener('arReady', handleArReady)
      }
    }
  }, [cameraPermissionGranted, isArReady])

  return (
    <div 
      className="scan-page"
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Acima do vídeo (-1), mas transparente
        overflow: 'hidden',
        backgroundImage: 'none',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        pointerEvents: 'none' // Permitir que eventos passem através
      }}
    >
      {/* Toggles de Libras e Audiodescrição no topo */}
      <div style={{
        position: 'fixed', 
        top: 10, 
        left: 0, 
        right: 0, 
        zIndex: 100000, 
        pointerEvents: 'auto', 
        width: '100%',
        display: 'block',
        visibility: 'visible',
        opacity: 1
      }}>
        <ToggleControls 
          onLibrasToggle={handleLibrasToggle}
          onAudioToggle={handleAudioToggle}
          showLogo={false}
          initialLibrasActive={true}
        />
      </div>

      {/* Botão Voltar como overlay */}
      <div 
        className="back-button-overlay" 
        onClick={handleBackClick} 
        style={{
          zIndex: 100000, 
          position: 'fixed', 
          pointerEvents: 'auto',
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
      >
        <SafeImage src="/ayamioja-ra/images/voltar_botao.png" alt="Voltar" className="back-button-image-overlay" />
      </div>

      {/* Vídeo de fundo da câmera - DEVE estar PRIMEIRO para ficar atrás de tudo */}
      {/* NÃO criar overlay separado - o MindAR gerencia o vídeo da câmera (#arVideo) */}

      {/* Botão para solicitar permissão da câmera */}
      {!cameraPermissionGranted && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100001,
            gap: '20px'
          }}
        >
          <div style={{ color: 'white', fontSize: '24px', textAlign: 'center', padding: '0 20px' }}>
            Para usar a Realidade Aumentada, precisamos acessar sua câmera
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🖱️ Botão clicado:', { isRequestingPermission, cameraPermissionGranted })
              if (!isRequestingPermission && !cameraPermissionGranted) {
                requestCameraPermission()
              } else {
                console.warn('⚠️ Botão bloqueado:', { isRequestingPermission, cameraPermissionGranted })
              }
            }}
            disabled={isRequestingPermission || cameraPermissionGranted}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: (isRequestingPermission || cameraPermissionGranted) ? '#666' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (isRequestingPermission || cameraPermissionGranted) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
              pointerEvents: (isRequestingPermission || cameraPermissionGranted) ? 'none' : 'auto'
            }}
          >
            {isRequestingPermission ? 'Solicitando permissão...' : cameraPermissionGranted ? 'Permissão concedida' : 'Permitir acesso à câmera'}
          </button>
        </div>
      )}

      {/* A-Frame + MindAR como backup: sem background/style; MindAR gerencia */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; uiScanning: #ui-scanning; uiLoading: #ui-loading; filterMinCF: 0.0001; filterBeta: 0.1; missTolerance: 15; warmupTolerance: 3; autoStart: false; showStats: false;"
        color-space="sRGB"
        renderer="colorManagement: true; physicallyCorrectLights: true; antialias: false; precision: mediump;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        embedded
        ui="enabled: false"
      >
        {/* Assets - Vídeos */}
        <a-assets>
          {/* Target 0 → video1 → anim_4.mp4 (substitui antigo ayo_teste.mp4) */}
          <video id="video1" src="/ayamioja-ra/ar-assets/assets/anim_4.mp4" preload="auto" crossOrigin="anonymous"></video>
          {/* Target 1 → video2 → anim_3.mp4 (mantém) */}
          <video id="video2" src="/ayamioja-ra/ar-assets/assets/anim_3.mp4" preload="auto" crossOrigin="anonymous" loop muted={false}></video>
          {/* Target 2 → video3 → anim_2.mp4 (mantém onde estava antes) */}
          <video id="video3" src="/ayamioja-ra/ar-assets/assets/anim_2.mp4" preload="auto" crossOrigin="anonymous" loop></video>
        </a-assets>

        {/* Targets */}
        <a-entity id="target0" mindar-image-target="targetIndex: 0">
          <a-video 
            src="#video1" 
            position="0 0 0" 
            rotation="0 0 0" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; transparent: false; opacity: 1.0"
            autoplay="true"
            visible="false"
          ></a-video>
        </a-entity>

        <a-entity id="target1" mindar-image-target="targetIndex: 1">
          <a-video 
            src="#video2" 
            position="0 0 0" 
            rotation="0 0 0" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; transparent: false; opacity: 1.0"
            autoplay="true"
            visible="false"
            loop="true"
          ></a-video>
        </a-entity>

        <a-entity id="target2" mindar-image-target="targetIndex: 2">
          <a-video 
            id="target2-video"
            src="#video3" 
            position="0 0 0" 
            rotation="0 0 0" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; transparent: false; opacity: 1.0"
            autoplay="true"
            visible="false"
            loop="true"
          ></a-video>
        </a-entity>

        {/* Camera */}
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      </a-scene>

      {/* Placeholders para MindAR (uiScanning/uiLoading); nosso overlay "Aponte câmera..." mantido abaixo */}
      <div id="ui-scanning" style={{ display: 'none' }} aria-hidden="true" />
      {!isArReady && (
        <div id="ui-loading" className="ui-loading" style={{ display: 'flex' }}>
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando AR...</p>
          </div>
        </div>
      )}

      {/* Animação de Scanning - mostra quando não há target ativo */}
      {cameraPermissionGranted && showScanningAnimation && activeTargetIndex === null && (
        <div 
          className="ar-scanning-overlay" 
          style={{
            zIndex: 100000, 
            position: 'fixed', 
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: 'visible',
            opacity: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'transparent'
          }}
          onLoad={() => console.log('✅ Animação de scanning renderizada')}
        >
          <div className="scanning-circles">
            <div className="scanning-circle-outer"></div>
            <div className="scanning-circle-inner"></div>
          </div>
          <p 
            className="scanning-instruction"
            style={{
              color: 'white',
              fontSize: '18px',
              textAlign: 'center',
              marginTop: '20px',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              display: 'block',
              visibility: 'visible',
              opacity: 1
            }}
          >
            Aponte a câmera do celular para o livro
          </p>
        </div>
      )}

      {/* DESATIVADO: Vídeo de Libras desativado
      {activeTargetIndex !== null && (
        <div className="interpreter-container">
          {activeTargetIndex === 0 && <LibrasInterpreter videoId="video1" isActive={isLibrasActive} />}
          {activeTargetIndex === 1 && <LibrasInterpreter videoId="video2" isActive={isLibrasActive} />}
          {activeTargetIndex === 2 && <LibrasInterpreter videoId="video3" isActive={isLibrasActive} />}
        </div>
      )}
      */}

      {/* Audiodescrição sincronizada com vídeos AR */}
      <AudioDescriptionAR 
        audioActive={audioActive}
        videoState={videoState}
        activeTargetIndex={activeTargetIndex}
      />

      <div className="scan-footer">
        <p>Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados</p>
      </div>
    </div>
  )
}

export default ScanPage
