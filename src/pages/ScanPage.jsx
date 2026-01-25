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

  // Android: Apenas CSS transparente no canvas. SEM interceptar WebGL.
  // Interceptações (gl.clearColor, clear, drawArrays, etc.) quebram o a-video:
  // o áudio toca mas o vídeo não aparece (fica "por baixo").
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid || !cameraPermissionGranted) return

    const forceAndroidTransparency = () => {
      const scene = sceneRef.current
      if (!scene) return
      const canvas = scene.querySelector('canvas')
      if (!canvas) return

      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
      canvas.style.setProperty('z-index', '1', 'important')
    }

    forceAndroidTransparency()
    const interval = setInterval(forceAndroidTransparency, 1000)

    return () => clearInterval(interval)
  }, [cameraPermissionGranted])

  // REMOVIDO: Não gerenciar o vídeo manualmente - o MindAR gerencia tudo

  // REMOVIDO: Loop duplicado que estava causando conflitos e piscar
  // O overlay já é gerenciado pelo loop principal em outro useEffect

  // REMOVIDO: Não gerenciar o vídeo manualmente - o MindAR gerencia tudo

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

  // Configurar MindAR quando o componente montar
  useEffect(() => {
    console.log('🎯 Iniciando configuração do AR...')
    
    // NOTA: A permissão da câmera agora é solicitada através do botão inicial
    // Não solicitar automaticamente para evitar bloqueios de autoplay
    
    // Marcar body como scan-page ativa para CSS
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')
    
    // FORÇAR background transparente imediatamente
    // IMPORTANTE: NÃO usar preto, usar transparente para que o vídeo da câmera apareça
    // CRÍTICO: Garantir que body e html sejam transparentes para o vídeo aparecer
    document.body.style.setProperty('background-color', 'transparent', 'important')
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background-color', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    // Garantir que body e html não tenham z-index que interfira
    document.body.style.setProperty('z-index', 'auto', 'important')
    document.documentElement.style.setProperty('z-index', 'auto', 'important')
    
    // Garantir que o elemento .scan-page também seja transparente
    const scanPage = document.querySelector('.scan-page')
    if (scanPage) {
      scanPage.style.setProperty('background-color', 'transparent', 'important')
      scanPage.style.setProperty('background', 'transparent', 'important')
    }
    
    // Garantir que o body e html não tenham background branco
    const bodyStyle = window.getComputedStyle(document.body)
    const htmlStyle = window.getComputedStyle(document.documentElement)
    console.log('🎨 Background inicial:', {
      bodyBg: bodyStyle.backgroundColor,
      bodyBgColor: bodyStyle.backgroundColor,
      htmlBg: htmlStyle.backgroundColor,
      htmlBgColor: htmlStyle.backgroundColor
    })
    
    const scene = sceneRef.current
    if (!scene) {
      console.log('❌ Scene ref não encontrada')
      return
    }
    
    // MutationObserver será criado depois que ensureCameraVideoVisible estiver definida

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

    // Pré-carregar vídeos logo após a inicialização
    console.log("🚀 Iniciando pré-carregamento de vídeos...")
    preloadVideos()

    // Forçar background transparente periodicamente (caso algum CSS externo sobrescreva)
    const backgroundCheckInterval = setInterval(() => {
      document.body.style.setProperty('background-color', 'transparent', 'important')
      document.body.style.setProperty('background', 'transparent', 'important')
      document.documentElement.style.setProperty('background-color', 'transparent', 'important')
      document.documentElement.style.setProperty('background', 'transparent', 'important')
      
      // Garantir canvas transparente também
      const canvas = scene.querySelector('canvas')
      if (canvas) {
        canvas.style.setProperty('background-color', 'transparent', 'important')
        canvas.style.setProperty('background', 'transparent', 'important')
      }
    }, 1000) // Verificar a cada 1 segundo
    
    // Parar verificação de background após 30 segundos
    const backgroundCheckTimeout = setTimeout(() => {
      clearInterval(backgroundCheckInterval)
    }, 30000)
    
    // Depois tentar periodicamente (após a função ser definida)
    // A função será chamada via ensureCameraVideoVisibleRef.current após ser definida
    
    // Parar verificação inicial após 10 segundos
    initialCameraTimeoutRef.current = setTimeout(() => {
      if (initialCameraCheckRef.current) {
        clearInterval(initialCameraCheckRef.current)
        initialCameraCheckRef.current = null
        console.log('⏱️ Parando verificação inicial da câmera após 10s')
      }
    }, 10000)

    // Função global: apenas CSS no canvas. SEM interceptar WebGL (quebra a-video no Android).
    const makeRendererTransparent = () => {
      const canvas = scene.querySelector('canvas')
      if (!canvas) return false
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.backgroundColor = 'transparent'
      canvas.style.background = 'transparent'
      canvas.style.opacity = '1'
      return true
    }

    // Android: apenas CSS (canvas + scene). SEM interceptar WebGL – quebra a-video.
    const forceAndroidTransparency = () => {
      const isAndroid = /Android/i.test(navigator.userAgent)
      if (!isAndroid) return
      const scene = sceneRef.current
      if (!scene) return
      const canvas = scene.querySelector('canvas')
      if (!canvas) return

      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
      canvas.style.setProperty('z-index', '1', 'important')

      scene.style.setProperty('background-color', 'transparent', 'important')
      scene.style.setProperty('background', 'transparent', 'important')
      scene.style.setProperty('opacity', '1', 'important')

      const mindarVideo = document.querySelector('#arVideo') ||
        Array.from(document.querySelectorAll('video')).find(v =>
          v.id !== 'video1' && v.id !== 'video2' && v.id !== 'video3' &&
          (v.srcObject || v.videoWidth > 0)
        )
      if (mindarVideo) {
        mindarVideo.style.setProperty('z-index', '-2', 'important')
        mindarVideo.style.setProperty('position', 'fixed', 'important')
        mindarVideo.style.setProperty('top', '0', 'important')
        mindarVideo.style.setProperty('left', '0', 'important')
        mindarVideo.style.setProperty('width', '100vw', 'important')
        mindarVideo.style.setProperty('height', '100vh', 'important')
        mindarVideo.style.setProperty('object-fit', 'cover', 'important')
      }
    }

    // Primeira interação do usuário (só funciona após permissão concedida)
    let userInteracted = false
    const handleFirstInteraction = async () => {
      if (!cameraPermissionGranted) {
        console.log('⏳ Clique recebido, mas aguardando permissão da câmera...')
        return
      }
      if (userInteracted) return
      userInteracted = true
      document.body.removeEventListener("click", handleFirstInteraction)
      
      console.log("👆 Primeira interação do usuário detectada")
      
      // REMOVIDO: Deixar o MindAR gerenciar completamente a câmera
      makeRendererTransparent()
      
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

    // REMOVIDO: Não gerenciar o vídeo manualmente - o MindAR gerencia tudo
    // O MindAR cria e gerencia o vídeo da câmera automaticamente
    // Apenas garantir que o canvas seja transparente
    const ensureCameraVideoVisible = () => {
      // Garantir transparência do canvas primeiro
      makeRendererTransparent()
      forceCanvasTransparency()
      
      // Encontrar o vídeo da câmera do MindAR
      if (!cameraPermissionGranted) {
        return false
      }
      
      // Tentar encontrar o vídeo de várias formas
      let mindarVideo = document.querySelector('#arVideo')
      
      if (!mindarVideo) {
        // Procurar por vídeos que não são os vídeos AR (video1, video2, video3)
        const allVideos = Array.from(document.querySelectorAll('video'))
        console.log('🔍 Procurando vídeo da câmera entre', allVideos.length, 'vídeos encontrados')
        mindarVideo = allVideos.find(v => {
          const id = v.id || ''
          // Não é um dos vídeos AR
          if (['video1', 'video2', 'video3'].includes(id)) return false
          // Tem stream ou dimensões de vídeo (é a câmera)
          const hasStream = !!(v.srcObject || v.videoWidth > 0)
          const isAutoplay = v.getAttribute('autoplay') === 'true' || v.autoplay
          console.log('📹 Verificando vídeo:', { id, hasStream, isAutoplay, videoWidth: v.videoWidth, srcObject: !!v.srcObject })
          return hasStream || isAutoplay
        })
      }
      
      if (!mindarVideo) {
        console.log('⏳ Vídeo da câmera ainda não encontrado')
        return false
      }
      
      console.log('✅ Vídeo da câmera encontrado:', {
        id: mindarVideo.id,
        videoWidth: mindarVideo.videoWidth,
        videoHeight: mindarVideo.videoHeight,
        hasSrcObject: !!mindarVideo.srcObject,
        paused: mindarVideo.paused,
        readyState: mindarVideo.readyState
      })
      
      // CRÍTICO: Garantir que o vídeo esteja no body (não dentro do a-scene)
      // O MindAR pode criar o vídeo dentro do a-scene, o que pode causar problemas de visibilidade
      if (mindarVideo.parentElement !== document.body) {
        console.log('🔧 Movendo vídeo para o body para garantir visibilidade')
        const parent = mindarVideo.parentElement
        console.log('📦 Vídeo estava em:', parent?.tagName, parent?.id || parent?.className)
        
        // Remover do parent atual antes de mover
        if (parent) {
          parent.removeChild(mindarVideo)
        }
        // Adicionar como primeiro filho do body para garantir que fique atrás de tudo
        if (document.body.firstChild) {
          document.body.insertBefore(mindarVideo, document.body.firstChild)
        } else {
          document.body.appendChild(mindarVideo)
        }
        console.log('✅ Vídeo movido para o body')
      }
      
      // Verificar se o parent tem estilos que podem limitar o tamanho
      const parent = mindarVideo.parentElement
      if (parent && parent !== document.body) {
        const parentStyle = window.getComputedStyle(parent)
        if (parentStyle.position !== 'static' || 
            parentStyle.overflow === 'hidden' ||
            parseInt(parentStyle.width) < window.innerWidth ||
            parseInt(parentStyle.height) < window.innerHeight) {
          console.warn('⚠️ Parent do vídeo pode estar limitando tamanho:', {
            parentTag: parent.tagName,
            parentPosition: parentStyle.position,
            parentWidth: parentStyle.width,
            parentHeight: parentStyle.height,
            parentOverflow: parentStyle.overflow
          })
        }
      }
      
      // Garantir que o vídeo esteja visível e posicionado corretamente
      const computedStyle = window.getComputedStyle(mindarVideo)
      
      // Verificar tamanho atual vs viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const currentWidth = parseInt(computedStyle.width) || 0
      const currentHeight = parseInt(computedStyle.height) || 0
      const widthDiff = Math.abs(currentWidth - viewportWidth)
      const heightDiff = Math.abs(currentHeight - viewportHeight)
      
      // Verificar se precisa ajustar
      const needsAdjustment = 
        computedStyle.position !== 'fixed' ||
        computedStyle.zIndex !== '-2' ||
        widthDiff > 10 || // Mais de 10px de diferença
        heightDiff > 10 ||
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0'
      
      if (needsAdjustment) {
        console.log('🔧 Aplicando estilos ao vídeo da câmera:', {
          currentPosition: computedStyle.position,
          currentZIndex: computedStyle.zIndex,
          currentWidth: computedStyle.width,
          currentHeight: computedStyle.height,
          viewportWidth,
          viewportHeight,
          widthDiff,
          heightDiff
        })
        
        // Remover atributos width/height que podem interferir
        mindarVideo.removeAttribute('width')
        mindarVideo.removeAttribute('height')
        
        // Aplicar TODOS os estilos necessários de forma agressiva
        mindarVideo.style.position = 'fixed'
        mindarVideo.style.top = '0'
        mindarVideo.style.left = '0'
        mindarVideo.style.width = '100vw'
        mindarVideo.style.height = '100vh'
        mindarVideo.style.objectFit = 'cover'
        mindarVideo.style.zIndex = '-2'
        mindarVideo.style.margin = '0'
        mindarVideo.style.padding = '0'
        mindarVideo.style.backgroundColor = 'transparent'
        mindarVideo.style.display = 'block'
        mindarVideo.style.visibility = 'visible'
        mindarVideo.style.opacity = '1'
        
        // Também usar setProperty com !important para garantir prioridade
        mindarVideo.style.setProperty('position', 'fixed', 'important')
        mindarVideo.style.setProperty('top', '0', 'important')
        mindarVideo.style.setProperty('left', '0', 'important')
        mindarVideo.style.setProperty('width', '100vw', 'important')
        mindarVideo.style.setProperty('height', '100vh', 'important')
        mindarVideo.style.setProperty('object-fit', 'cover', 'important')
        mindarVideo.style.setProperty('z-index', '-2', 'important')
        mindarVideo.style.setProperty('margin', '0', 'important')
        mindarVideo.style.setProperty('padding', '0', 'important')
        mindarVideo.style.setProperty('background-color', 'transparent', 'important')
        mindarVideo.style.setProperty('display', 'block', 'important')
        mindarVideo.style.setProperty('visibility', 'visible', 'important')
        mindarVideo.style.setProperty('opacity', '1', 'important')
        
        // Verificar se os estilos foram aplicados corretamente
        setTimeout(() => {
          const newComputedStyle = window.getComputedStyle(mindarVideo)
          const actualWidth = parseInt(newComputedStyle.width) || 0
          const actualHeight = parseInt(newComputedStyle.height) || 0
          
          if (Math.abs(actualWidth - viewportWidth) > 10 || Math.abs(actualHeight - viewportHeight) > 10) {
            console.warn('⚠️ Vídeo não está cobrindo toda a tela:', {
              expectedWidth: viewportWidth,
              actualWidth,
              expectedHeight: viewportHeight,
              actualHeight,
              computedWidth: newComputedStyle.width,
              computedHeight: newComputedStyle.height,
              inlineWidth: mindarVideo.style.width,
              inlineHeight: mindarVideo.style.height
            })
          } else {
            console.log('✅ Vídeo está cobrindo toda a tela corretamente')
          }
        }, 100)
      }
      
      // Garantir que o vídeo esteja reproduzindo
      if (mindarVideo.paused && mindarVideo.readyState >= 2) {
        const hasStream = !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0)
        if (hasStream) {
          console.log('▶️ Tentando reproduzir vídeo da câmera')
          mindarVideo.play().catch(e => {
            console.warn('⚠️ Erro ao reproduzir vídeo da câmera:', e)
          })
        }
      }
      
      // DIAGNÓSTICO FINAL: Verificar se o vídeo está realmente visível
      setTimeout(() => {
        const finalComputedStyle = window.getComputedStyle(mindarVideo)
        const finalRect = mindarVideo.getBoundingClientRect()
        const isVisible = 
          finalComputedStyle.display !== 'none' &&
          finalComputedStyle.visibility !== 'hidden' &&
          finalComputedStyle.opacity !== '0' &&
          finalRect.width > 0 &&
          finalRect.height > 0
        
        // Verificar se há elementos cobrindo o vídeo
        const canvas = document.querySelector('canvas')
        const aScene = document.querySelector('a-scene')
        let canvasInfo = null
        let aSceneInfo = null
        
        if (canvas) {
          const canvasStyle = window.getComputedStyle(canvas)
          const canvasRect = canvas.getBoundingClientRect()
          canvasInfo = {
            zIndex: canvasStyle.zIndex,
            position: canvasStyle.position,
            backgroundColor: canvasStyle.backgroundColor,
            opacity: canvasStyle.opacity,
            display: canvasStyle.display,
            visibility: canvasStyle.visibility,
            boundingRect: {
              top: canvasRect.top,
              left: canvasRect.left,
              width: canvasRect.width,
              height: canvasRect.height
            },
            isCoveringVideo: canvasRect.width >= window.innerWidth && canvasRect.height >= window.innerHeight
          }
        }
        
        if (aScene) {
          const aSceneStyle = window.getComputedStyle(aScene)
          const aSceneRect = aScene.getBoundingClientRect()
          aSceneInfo = {
            zIndex: aSceneStyle.zIndex,
            position: aSceneStyle.position,
            backgroundColor: aSceneStyle.backgroundColor,
            opacity: aSceneStyle.opacity,
            display: aSceneStyle.display,
            visibility: aSceneStyle.visibility,
            boundingRect: {
              top: aSceneRect.top,
              left: aSceneRect.left,
              width: aSceneRect.width,
              height: aSceneRect.height
            }
          }
        }
        
        console.log('🔍 DIAGNÓSTICO FINAL - Vídeo da câmera do dispositivo:', {
          elemento: mindarVideo.tagName,
          id: mindarVideo.id || '(sem id)',
          parent: mindarVideo.parentElement?.tagName,
          parentId: mindarVideo.parentElement?.id || '(sem id)',
          parentClass: mindarVideo.parentElement?.className || '(sem classe)',
          display: finalComputedStyle.display,
          visibility: finalComputedStyle.visibility,
          opacity: finalComputedStyle.opacity,
          position: finalComputedStyle.position,
          zIndex: finalComputedStyle.zIndex,
          width: finalComputedStyle.width,
          height: finalComputedStyle.height,
          boundingRect: {
            top: finalRect.top,
            left: finalRect.left,
            width: finalRect.width,
            height: finalRect.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          isVisible,
          hasStream: !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0),
          videoWidth: mindarVideo.videoWidth,
          videoHeight: mindarVideo.videoHeight,
          paused: mindarVideo.paused,
          readyState: mindarVideo.readyState,
          canvas: canvasInfo,
          aScene: aSceneInfo
        })
        
        if (!isVisible) {
          console.error('❌ PROBLEMA: Vídeo da câmera do dispositivo NÃO está visível!')
        } else if (finalRect.width < window.innerWidth * 0.9 || finalRect.height < window.innerHeight * 0.9) {
          console.warn('⚠️ PROBLEMA: Vídeo da câmera do dispositivo não está cobrindo toda a tela!')
        } else {
          console.log('✅ Vídeo da câmera do dispositivo está visível e cobrindo a tela corretamente')
        }
        
        // Verificar se o canvas está cobrindo o vídeo
        if (canvasInfo && canvasInfo.isCoveringVideo) {
          const videoZIndex = parseInt(finalComputedStyle.zIndex) || 0
          const canvasZIndex = parseInt(canvasInfo.zIndex) || 0
          
          if (canvasZIndex > videoZIndex) {
            // Canvas está na frente do vídeo (correto para AR overlay)
            // Mas precisa estar transparente!
            if (canvasInfo.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                canvasInfo.backgroundColor !== 'transparent') {
              console.error('❌ PROBLEMA CRÍTICO: Canvas tem background opaco!', canvasInfo.backgroundColor)
              // Forçar canvas transparente
              if (canvas) {
                canvas.style.setProperty('background-color', 'transparent', 'important')
                canvas.style.setProperty('background', 'transparent', 'important')
                makeRendererTransparent()
              }
            } else {
              // Canvas já transparente no CSS – nada a fazer. Não interceptar WebGL (quebra a-video no Android).
              makeRendererTransparent()
            }
          }
        }
      }, 200)
      
      return true // Vídeo encontrado e configurado
    }
    ensureCameraVideoVisibleRef.current = ensureCameraVideoVisible
    
    // Iniciar verificação periódica da câmera após a função ser definida
    if (!initialCameraCheckRef.current) {
      let checkCount = 0
      initialCameraCheckRef.current = setInterval(() => {
        if (ensureCameraVideoVisibleRef.current) {
          const found = ensureCameraVideoVisibleRef.current()
          if (found) {
            console.log('✅ Câmera encontrada e configurada! Continuando verificação para garantir...')
            // Não parar a verificação - continuar verificando para garantir que permaneça visível
          } else {
            checkCount++
            if (checkCount % 10 === 0) { // Log a cada 5 segundos (10 * 500ms)
              console.log('⏳ Ainda procurando vídeo da câmera... (tentativa', checkCount, ')')
            }
          }
        }
      }, 500) // Verificar a cada 500ms continuamente
    }
    
    // REMOVIDO: MutationObserver - deixar o MindAR gerenciar completamente
    // Não precisamos observar mudanças - o MindAR gerencia tudo

    // Configuração INICIAL do renderer (uma vez): setClearColor + alpha. SEM interceptar.
    // Sem isso o canvas limpa para branco opaco → tela branca. Interceptações quebram a-video no Android.
    const configureRenderer = () => {
      try {
        const canvas = scene?.querySelector('canvas')
        if (!canvas) return
        canvas.style.setProperty('background-color', 'transparent', 'important')
        canvas.style.setProperty('background', 'transparent', 'important')
        canvas.style.setProperty('opacity', '1', 'important')
        const rendererSystem = scene?.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer && typeof renderer.setClearColor === 'function') {
            renderer.setClearColor(0x000000, 0)
          }
          if (renderer?.domElement) {
            const gl = renderer.domElement.getContext('webgl') || renderer.domElement.getContext('webgl2')
            if (gl) {
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              gl.enable(gl.BLEND)
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            }
          }
        }
      } catch (e) {
        console.warn('configureRenderer:', e)
      }
    }
    if (isArReady) configureRenderer()

    // Aguardar o A-Frame carregar completamente
    const handleSceneLoaded = () => {
        console.log('✅ Scene A-Frame carregada')
        
        // FORÇAR background transparente novamente após scene carregar
        document.body.style.setProperty('background-color', 'transparent', 'important')
        document.body.style.setProperty('background', 'transparent', 'important')
        document.documentElement.style.setProperty('background-color', 'transparent', 'important')
        document.documentElement.style.setProperty('background', 'transparent', 'important')
        
        // Garantir que a câmera seja visível imediatamente após scene carregar
        setTimeout(() => {
          ensureCameraVideoVisible()
          makeRendererTransparent()
          
          // Forçar canvas transparente novamente
          const canvas = scene.querySelector('canvas')
          if (canvas) {
            canvas.style.setProperty('background-color', 'transparent', 'important')
            canvas.style.setProperty('background', 'transparent', 'important')
          }
        }, 100)
        
        // Pré-carregar vídeos imediatamente após scene carregar
        setTimeout(() => {
          preloadVideos()
        }, 500)
        
        // Configurar listeners para quando targets são encontrados
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
    
    // Função para lidar com arReady - deve ser definida antes de ser usada
    const handleArReady = () => {
      console.log('✅ MindAR pronto! O MindAR gerencia a câmera completamente.')
      setIsArReady(true)
      
      // Aplicar correções Android imediatamente
      setTimeout(() => {
        const forceAndroidTransparency = () => {
          const isAndroid = /Android/i.test(navigator.userAgent)
          if (!isAndroid) return
          
          const scene = sceneRef.current
          if (!scene) return
          
          const canvas = scene.querySelector('canvas')
          if (!canvas) return
          
          console.log('🔧 Aplicando correções Android após arReady...')
          canvas.style.setProperty('background-color', 'transparent', 'important')
          canvas.style.setProperty('background', 'transparent', 'important')
        }
        forceAndroidTransparency()
        makeRendererTransparent()
      }, 100)
      
      // Verificar e iniciar o MindAR se necessário
      // Aguardar um pouco mais para garantir que o tracker esteja inicializado
      setTimeout(() => {
        const mindarSystem = scene.systems?.mindar || 
                            scene.systems?.['mindar-image-system'] ||
                            scene.systems?.['mindar-image']
        
        if (mindarSystem) {
          console.log('🔍 Estado do MindAR após arReady:', {
            isTracking: mindarSystem.isTracking,
            isReady: mindarSystem.isReady,
            hasStart: typeof mindarSystem.start === 'function',
            hasTracker: !!mindarSystem.tracker
          })
          
          // Verificar se o tracker existe antes de tentar iniciar
          if (mindarSystem.tracker && mindarSystem.start && typeof mindarSystem.start === 'function') {
            // Verificar se já está rastreando antes de iniciar
            if (!mindarSystem.isTracking) {
              console.log('🚀 Iniciando MindAR após arReady...')
              try {
                mindarSystem.start()
                console.log('✅ MindAR iniciado após arReady')
                
                // Verificar novamente após iniciar
                setTimeout(() => {
                  console.log('🔍 Estado do MindAR após start():', {
                    isTracking: mindarSystem.isTracking,
                    isReady: mindarSystem.isReady,
                    hasTracker: !!mindarSystem.tracker,
                    trackerState: mindarSystem.tracker?.state || 'unknown'
                  })
                }, 500)
              } catch (e) {
                console.error('❌ Erro ao iniciar MindAR após arReady:', e)
              }
            } else {
              console.log('✅ MindAR já está rastreando')
            }
          } else {
            if (!mindarSystem.tracker) {
              console.warn('⚠️ Tracker do MindAR ainda não está inicializado. Aguardando...')
              // Tentar novamente após mais tempo
              setTimeout(() => {
                if (mindarSystem.tracker && mindarSystem.start && typeof mindarSystem.start === 'function' && !mindarSystem.isTracking) {
                  try {
                    mindarSystem.start()
                    console.log('✅ MindAR iniciado após espera adicional')
                    
                    // Verificar novamente após iniciar
                    setTimeout(() => {
                      console.log('🔍 Estado do MindAR após start() (espera adicional):', {
                        isTracking: mindarSystem.isTracking,
                        isReady: mindarSystem.isReady,
                        hasTracker: !!mindarSystem.tracker,
                        trackerState: mindarSystem.tracker?.state || 'unknown'
                      })
                    }, 500)
                  } catch (e) {
                    console.error('❌ Erro ao iniciar MindAR após espera:', e)
                  }
                }
              }, 1000)
            }
          }
        } else {
          console.warn('⚠️ Sistema MindAR não encontrado após arReady')
        }
      }, 1000) // Aumentar o delay para dar tempo do tracker inicializar
      
      // Verificar se o MindAR criou o vídeo da câmera e garantir visibilidade
      setTimeout(() => {
        // Usar a função centralizada para garantir visibilidade do vídeo
        if (ensureCameraVideoVisibleRef.current) {
          const found = ensureCameraVideoVisibleRef.current()
          if (found) {
            console.log('✅ Vídeo da câmera encontrado e configurado após arReady')
          }
        }
        
        // Log detalhado apenas uma vez para debug
        const mindarVideo = document.querySelector('#arVideo') || 
                           Array.from(document.querySelectorAll('video')).find(v => {
                             const id = v.id || ''
                             if (['video1', 'video2', 'video3'].includes(id)) return false
                             return (v.videoWidth > 0 || v.srcObject) && !v.src
                           })
        
        if (mindarVideo && !mindarVideo.dataset.logged) {
          const computedStyle = window.getComputedStyle(mindarVideo)
          const hasStream = !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0)
          const isPlaying = !mindarVideo.paused && !mindarVideo.ended
          
          console.log('✅ Vídeo do MindAR encontrado após arReady:', {
            id: mindarVideo.id,
            videoWidth: mindarVideo.videoWidth,
            videoHeight: mindarVideo.videoHeight,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height,
            hasStream,
            hasSrcObject: !!mindarVideo.srcObject,
            isPlaying,
            paused: mindarVideo.paused,
            readyState: mindarVideo.readyState
          })
          mindarVideo.dataset.logged = 'true'
          
          // Verificar se o vídeo está realmente atrás do canvas
          const canvas = scene.querySelector('canvas')
          if (canvas) {
            const canvasStyle = window.getComputedStyle(canvas)
            const videoZ = parseInt(computedStyle.zIndex) || -2
            const canvasZ = parseInt(canvasStyle.zIndex) || 1
            
            console.log('📊 Verificação de z-index:', {
              videoZIndex: computedStyle.zIndex,
              canvasZIndex: canvasStyle.zIndex,
              videoPosition: computedStyle.position,
              canvasPosition: canvasStyle.position,
              canvasBackgroundColor: canvasStyle.backgroundColor,
              canvasOpacity: canvasStyle.opacity
            })
            
            if (canvasZ > videoZ) {
              console.log('✅ Canvas está na frente do vídeo (correto para overlay AR)')
              console.log('✅ Canvas deve estar transparente para mostrar o vídeo')
              
              // CRÍTICO: Verificar se o canvas realmente permite ver através dele
              if (canvasStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                  canvasStyle.backgroundColor !== 'transparent') {
                console.error('❌ PROBLEMA: Canvas NÃO está transparente! backgroundColor:', canvasStyle.backgroundColor)
              }
            } else {
              console.warn('⚠️ Canvas pode estar atrás do vídeo - verificar z-index')
            }
          }
        } else if (!mindarVideo) {
          console.log('⏳ Vídeo do MindAR ainda não foi criado - ele será criado automaticamente')
        }
      }, 1000)
      
      // Garantir que a animação de scanning apareça se não houver target ativo
      if (activeTargetIndex === null) {
        setShowScanningAnimation(true)
        console.log('✅ Mostrando animação de scanning - nenhum target ativo')
      }
      
      // SIMPLIFICADO: Apenas garantir transparência do canvas
      // O MindAR gerencia completamente o vídeo da câmera - não precisamos fazer mais nada
      forceCanvasTransparency()
      makeRendererTransparent()
      
      // GARANTIR que o a-scene esteja visível e transparente
      if (scene) {
        // Detectar Android/Chrome para aplicar correções mais agressivas
        const isAndroid = /Android/i.test(navigator.userAgent)
        const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
        const needsAggressiveFix = isAndroid && isChrome
        
        scene.style.setProperty('opacity', '1', 'important')
        scene.style.setProperty('z-index', '1', 'important') // Acima do vídeo (-1), mas transparente
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
        scene.style.setProperty('position', 'fixed', 'important')
        scene.style.setProperty('top', '0', 'important')
        scene.style.setProperty('left', '0', 'important')
        scene.style.setProperty('width', '100vw', 'important')
        scene.style.setProperty('height', '100vh', 'important')
        
        // No Android/Chrome, forçar background transparente no atributo também
        if (needsAggressiveFix) {
          scene.setAttribute('background', 'color: #000000; opacity: 0')
          
          // Interceptar e DESABILITAR completamente o sistema de background do A-Frame
          if (scene.systems && scene.systems.background) {
            const backgroundSystem = scene.systems.background
            
            // Desabilitar o sistema completamente interceptando seus métodos
            if (backgroundSystem.update && !backgroundSystem._updateIntercepted) {
              backgroundSystem._originalUpdate = backgroundSystem.update.bind(backgroundSystem)
              backgroundSystem.update = function() {
                // Não fazer nada - desabilitar completamente
              }
              backgroundSystem._updateIntercepted = true
            }
            
            // Forçar background transparente no sistema
            if (backgroundSystem.setBackground) {
              backgroundSystem.setBackground('transparent', 0)
            }
            
            // Remover ou esconder o elemento de background se existir
            if (backgroundSystem.el) {
              const bgEl = backgroundSystem.el
              if (bgEl) {
                bgEl.style.setProperty('display', 'none', 'important')
                bgEl.style.setProperty('visibility', 'hidden', 'important')
                bgEl.style.setProperty('background-color', 'transparent', 'important')
                bgEl.style.setProperty('background', 'transparent', 'important')
                bgEl.style.setProperty('opacity', '0', 'important')
                bgEl.style.setProperty('pointer-events', 'none', 'important')
                // Tentar remover do DOM se possível
                if (bgEl.parentNode) {
                  try {
                    bgEl.remove()
                  } catch (e) {
                    console.warn('⚠️ Não foi possível remover elemento de background:', e)
                  }
                }
              }
            }
          }
          
          // Procurar e remover qualquer elemento que possa ser o background do A-Frame
          const possibleBackgroundElements = scene.querySelectorAll('[data-aframe-background], .a-background, [class*="background"]')
          possibleBackgroundElements.forEach(bgEl => {
            if (bgEl.tagName !== 'CANVAS' && bgEl.tagName !== 'VIDEO') {
              const bgStyle = window.getComputedStyle(bgEl)
              const bgColor = bgStyle.backgroundColor
              if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
                console.warn('⚠️ Removendo elemento de background preto do A-Frame:', bgEl)
                bgEl.style.setProperty('display', 'none', 'important')
                bgEl.style.setProperty('visibility', 'hidden', 'important')
                bgEl.style.setProperty('opacity', '0', 'important')
                try {
                  bgEl.remove()
                } catch (e) {
                  // Ignorar se não puder remover
                }
              }
            }
          })
          
          // Verificar e corrigir elementos filhos do a-scene que possam ter background preto
          const sceneChildren = scene.querySelectorAll('*')
          sceneChildren.forEach(child => {
            const childStyle = window.getComputedStyle(child)
            const bgColor = childStyle.backgroundColor
            if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
              // Ignorar canvas e vídeos AR
              if (child.tagName !== 'CANVAS' && child.tagName !== 'VIDEO' && !child.id.includes('video')) {
                child.style.setProperty('background-color', 'transparent', 'important')
                child.style.setProperty('background', 'transparent', 'important')
                child.style.setProperty('opacity', '1', 'important')
              }
            }
          })
          
          // Verificar se há um elemento a-sky ou similar que possa estar criando background
          const skyElement = scene.querySelector('a-sky')
          if (skyElement) {
            console.warn('⚠️ Removendo elemento a-sky que pode estar criando background preto')
            skyElement.style.setProperty('display', 'none', 'important')
            skyElement.style.setProperty('visibility', 'hidden', 'important')
            skyElement.style.setProperty('opacity', '0', 'important')
            try {
              skyElement.remove()
            } catch (e) {
              // Ignorar se não puder remover
            }
          }
          
          // Verificação EXTRA AGRESSIVA: Procurar qualquer elemento grande com background preto e remover
          const allSceneElements = scene.querySelectorAll('*')
          allSceneElements.forEach(el => {
            if (el.tagName === 'CANVAS' || el.tagName === 'VIDEO' || el.id.includes('video')) {
              return // Ignorar canvas e vídeos
            }
            
            const rect = el.getBoundingClientRect()
            const style = window.getComputedStyle(el)
            const bgColor = style.backgroundColor
            
            // Se o elemento é grande (cobre mais de 50% da tela) e tem background preto
            if (rect.width > window.innerWidth * 0.5 && 
                rect.height > window.innerHeight * 0.5 &&
                bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
              console.error('❌ ELEMENTO GRANDE COM BACKGROUND PRETO DETECTADO E REMOVIDO:', {
                tag: el.tagName,
                id: el.id,
                className: el.className,
                width: rect.width,
                height: rect.height,
                backgroundColor: bgColor
              })
              el.style.setProperty('display', 'none', 'important')
              el.style.setProperty('visibility', 'hidden', 'important')
              el.style.setProperty('opacity', '0', 'important')
              el.style.setProperty('pointer-events', 'none', 'important')
              try {
                el.remove()
              } catch (e) {
                console.warn('⚠️ Não foi possível remover elemento:', e)
              }
            }
          })
        }
        
        console.log('✅ a-scene configurado como visível após arReady', needsAggressiveFix ? '[Android/Chrome: correções agressivas]' : '')
        
        // Garantir que o canvas também esteja visível e transparente
        const canvas = scene.querySelector('canvas')
        if (canvas) {
          canvas.style.setProperty('opacity', '1', 'important')
          canvas.style.setProperty('z-index', '1', 'important') // Acima do vídeo (-1), mas transparente
          canvas.style.setProperty('background-color', 'transparent', 'important')
          canvas.style.setProperty('background', 'transparent', 'important')
          canvas.style.setProperty('position', 'fixed', 'important')
          canvas.style.setProperty('top', '0', 'important')
          canvas.style.setProperty('left', '0', 'important')
          canvas.style.setProperty('width', '100vw', 'important')
          canvas.style.setProperty('height', '100vh', 'important')
          forceCanvasTransparency()
          console.log('✅ Canvas configurado como visível e transparente após arReady')
        }
      }
      
      // Esconder UI de loading manualmente
      const uiLoading = document.getElementById('ui-loading')
      if (uiLoading) {
        uiLoading.style.display = 'none'
        console.log('✅ UI Loading escondida')
      }
    }
    
    // Aguardar o A-Frame carregar completamente e então configurar listeners
    scene.addEventListener('loaded', handleSceneLoaded)
    
    // Adicionar listener para arReady
    scene.addEventListener('arReady', handleArReady)
    
    // Apenas CSS no canvas. SEM interceptar WebGL – quebra a-video no Android (áudio toca, vídeo não aparece).
    const forceCanvasTransparency = () => {
      const canvas = scene.querySelector('canvas')
      if (!canvas) return
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('z-index', '1', 'important')
      canvas.style.setProperty('position', 'fixed', 'important')
      canvas.style.setProperty('top', '0', 'important')
      canvas.style.setProperty('left', '0', 'important')
      canvas.style.setProperty('width', '100vw', 'important')
      canvas.style.setProperty('height', '100vh', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
    }
    
    // Detectar Android/Chrome uma vez para usar em múltiplos lugares
    const isAndroidDevice = /Android/i.test(navigator.userAgent)
    const isChromeBrowser = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
    const needsAggressiveFix = isAndroidDevice && isChromeBrowser
    
    // MutationObserver para detectar e remover elementos criados dinamicamente com background preto
    if (blackElementObserverRef.current) {
      blackElementObserverRef.current.disconnect()
    }
    blackElementObserverRef.current = new MutationObserver((mutations) => {
      if (!needsAggressiveFix) return
      
      if (!needsAggressiveFix) return
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const el = node
            // Ignorar canvas e vídeos
            if (el.tagName === 'CANVAS' || el.tagName === 'VIDEO' || el.id?.includes('video')) {
              return
            }
            
            const rect = el.getBoundingClientRect()
            const style = window.getComputedStyle(el)
            const bgColor = style.backgroundColor
            
            // Se o elemento é grande e tem background preto, remover imediatamente
            if (rect.width > window.innerWidth * 0.3 && 
                rect.height > window.innerHeight * 0.3 &&
                bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
              console.error('❌ NOVO ELEMENTO COM BACKGROUND PRETO DETECTADO E REMOVIDO:', {
                tag: el.tagName,
                id: el.id,
                className: el.className,
                width: rect.width,
                height: rect.height,
                backgroundColor: bgColor
              })
              el.style.setProperty('display', 'none', 'important')
              el.style.setProperty('visibility', 'hidden', 'important')
              el.style.setProperty('opacity', '0', 'important')
              el.style.setProperty('pointer-events', 'none', 'important')
              try {
                el.remove()
              } catch (e) {
                // Ignorar se não puder remover
              }
            }
          }
        })
      })
    })
    
    // Observar mudanças no DOM, especialmente no a-scene
    if (scene && blackElementObserverRef.current) {
      blackElementObserverRef.current.observe(scene, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }
    
    // Observar mudanças no body também
    if (blackElementObserverRef.current) {
      blackElementObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }
    
    // Loop para forçar transparência continuamente e garantir visibilidade do vídeo
    if (transparencyIntervalRef.current) {
      clearInterval(transparencyIntervalRef.current)
    }
    transparencyIntervalRef.current = setInterval(() => {
      forceCanvasTransparency()
      makeRendererTransparent()
      
      // No Android/Chrome, forçar a-scene e seus elementos a serem transparentes (apenas CSS/DOM, sem WebGL)
      if (needsAggressiveFix && scene) {
        // Forçar a-scene transparente
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
        scene.setAttribute('background', 'color: #000000; opacity: 0')
        
        // Interceptar e DESABILITAR completamente o sistema de background do A-Frame
        if (scene.systems && scene.systems.background) {
          const backgroundSystem = scene.systems.background
          
          // Desabilitar o sistema completamente interceptando seus métodos
          if (backgroundSystem.update && !backgroundSystem._updateIntercepted) {
            backgroundSystem._originalUpdate = backgroundSystem.update.bind(backgroundSystem)
            backgroundSystem.update = function() {
              // Não fazer nada - desabilitar completamente
            }
            backgroundSystem._updateIntercepted = true
          }
          
          // Forçar background transparente no sistema
          if (backgroundSystem.setBackground) {
            backgroundSystem.setBackground('transparent', 0)
          }
          
          // Remover ou esconder o elemento de background se existir
          if (backgroundSystem.el) {
            const bgEl = backgroundSystem.el
            if (bgEl) {
              bgEl.style.setProperty('display', 'none', 'important')
              bgEl.style.setProperty('visibility', 'hidden', 'important')
              bgEl.style.setProperty('background-color', 'transparent', 'important')
              bgEl.style.setProperty('background', 'transparent', 'important')
              bgEl.style.setProperty('opacity', '0', 'important')
              bgEl.style.setProperty('pointer-events', 'none', 'important')
              // Tentar remover do DOM se possível
              if (bgEl.parentNode) {
                try {
                  bgEl.remove()
                } catch (e) {
                  console.warn('⚠️ Não foi possível remover elemento de background:', e)
                }
              }
            }
          }
        }
        
        // Procurar e remover qualquer elemento que possa ser o background do A-Frame
        const possibleBackgroundElements = scene.querySelectorAll('[data-aframe-background], .a-background, [class*="background"]')
        possibleBackgroundElements.forEach(bgEl => {
          if (bgEl.tagName !== 'CANVAS' && bgEl.tagName !== 'VIDEO') {
            const bgStyle = window.getComputedStyle(bgEl)
            const bgColor = bgStyle.backgroundColor
            if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
              console.warn('⚠️ Removendo elemento de background preto do A-Frame:', bgEl)
              bgEl.style.setProperty('display', 'none', 'important')
              bgEl.style.setProperty('visibility', 'hidden', 'important')
              bgEl.style.setProperty('opacity', '0', 'important')
              try {
                bgEl.remove()
              } catch (e) {
                // Ignorar se não puder remover
              }
            }
          }
        })
        
        // Verificar e corrigir elementos filhos do a-scene
        const sceneChildren = scene.querySelectorAll('*')
        sceneChildren.forEach(child => {
          const childStyle = window.getComputedStyle(child)
          const bgColor = childStyle.backgroundColor
          // Se não for canvas ou vídeo AR, e tiver background preto, forçar transparente
          if (child.tagName !== 'CANVAS' && child.tagName !== 'VIDEO' && !child.id.includes('video')) {
            if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
              child.style.setProperty('background-color', 'transparent', 'important')
              child.style.setProperty('background', 'transparent', 'important')
              child.style.setProperty('opacity', '1', 'important')
            }
          }
        })
        
        // Verificar se há um elemento a-sky ou similar que possa estar criando background
        const skyElement = scene.querySelector('a-sky')
        if (skyElement) {
          console.warn('⚠️ Removendo elemento a-sky que pode estar criando background preto')
          skyElement.style.setProperty('display', 'none', 'important')
          skyElement.style.setProperty('visibility', 'hidden', 'important')
          skyElement.style.setProperty('opacity', '0', 'important')
          try {
            skyElement.remove()
          } catch (e) {
            // Ignorar se não puder remover
          }
        }
        
        // Verificação EXTRA AGRESSIVA: Procurar qualquer elemento grande com background preto e remover
        const allSceneElements = scene.querySelectorAll('*')
        allSceneElements.forEach(el => {
          if (el.tagName === 'CANVAS' || el.tagName === 'VIDEO' || el.id.includes('video')) {
            return // Ignorar canvas e vídeos
          }
          
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          const bgColor = style.backgroundColor
          
          // Se o elemento é grande (cobre mais de 50% da tela) e tem background preto
          if (rect.width > window.innerWidth * 0.5 && 
              rect.height > window.innerHeight * 0.5 &&
              bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
            console.error('❌ ELEMENTO GRANDE COM BACKGROUND PRETO DETECTADO E REMOVIDO:', {
              tag: el.tagName,
              id: el.id,
              className: el.className,
              width: rect.width,
              height: rect.height,
              backgroundColor: bgColor
            })
            el.style.setProperty('display', 'none', 'important')
            el.style.setProperty('visibility', 'hidden', 'important')
            el.style.setProperty('opacity', '0', 'important')
            el.style.setProperty('pointer-events', 'none', 'important')
            try {
              el.remove()
            } catch (e) {
              console.warn('⚠️ Não foi possível remover elemento:', e)
            }
          }
        })
      }
      
      // Verificar e corrigir elementos com background preto que possam estar cobrindo os vídeos
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        const style = window.getComputedStyle(el)
        const bgColor = style.backgroundColor
        // Verificar se tem background preto ou quase preto
        if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
          // Ignorar elementos que devem ter background preto (como botões, etc)
          const tagName = el.tagName.toLowerCase()
          const className = el.className || ''
          const id = el.id || ''
          
          // Se não for um elemento de UI conhecido e estiver cobrindo a tela
          if (!['button', 'input', 'select', 'textarea'].includes(tagName) &&
              !className.includes('back-button') &&
              !className.includes('toggle') &&
              !className.includes('nav') &&
              !id.includes('ui-') &&
              !id.includes('loading')) {
            const rect = el.getBoundingClientRect()
            // Se o elemento está cobrindo uma grande parte da tela
            if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
              const zIndex = parseInt(style.zIndex) || 0
              // Se está na frente do canvas (z-index > 1) mas não é um elemento de UI
              if (zIndex > 1 && zIndex < 100000) {
                console.warn('⚠️ Elemento com background preto detectado, forçando transparência:', el)
                el.style.setProperty('background-color', 'transparent', 'important')
                el.style.setProperty('background', 'transparent', 'important')
              }
            }
          }
        }
      })
      
      // Garantir que o vídeo da câmera esteja visível (usando a função simplificada)
      if (ensureCameraVideoVisibleRef.current) {
        ensureCameraVideoVisibleRef.current()
      }
    }, 500) // Verificar a cada 500ms

    return () => {
      // Cleanup: remover listeners e intervalos quando componente desmontar
      if (transparencyIntervalRef.current) {
        clearInterval(transparencyIntervalRef.current)
        transparencyIntervalRef.current = null
      }
      if (initialCameraCheckRef.current) {
        clearInterval(initialCameraCheckRef.current)
        initialCameraCheckRef.current = null
      }
      if (initialCameraTimeoutRef.current) {
        clearTimeout(initialCameraTimeoutRef.current)
        initialCameraTimeoutRef.current = null
      }
      if (backgroundCheckInterval) {
        clearInterval(backgroundCheckInterval)
      }
      if (backgroundCheckTimeout) {
        clearTimeout(backgroundCheckTimeout)
      }
      if (sceneRef.current) {
        const scene = sceneRef.current
        scene.removeEventListener('loaded', handleSceneLoaded)
        scene.removeEventListener('arReady', handleArReady)
      }
      if (blackElementObserverRef.current) {
        blackElementObserverRef.current.disconnect()
        blackElementObserverRef.current = null
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

      {/* A-Frame Scene - SIMPLIFICADO: deixar MindAR gerenciar completamente */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 0; autoStart: true; showStats: false; uiScanning: none; uiLoading: none; uiError: none;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer={`colorManagement: true; physicallyCorrectLights: true; antialias: true; alpha: true; precision: highp; logarithmicDepthBuffer: true; preserveDrawingBuffer: ${/Android/i.test(navigator.userAgent) ? 'false' : 'false'}; powerPreference: high-performance;`}
        embedded
        background="color: transparent; opacity: 0"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          background: 'transparent',
          opacity: 1
        }}
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

      {/* UI Elements */}
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
