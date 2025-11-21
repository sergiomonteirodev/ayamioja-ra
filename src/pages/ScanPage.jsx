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

  const updateCanvasVisibility = (showCanvas) => {
    const scene = sceneRef.current
    if (!scene) return

    const canvas = scene.querySelector('canvas')
    if (!canvas) return

    const targetOpacity = showCanvas ? '1' : '0'
    canvas.style.setProperty('opacity', targetOpacity, 'important')
    canvas.style.setProperty('pointer-events', showCanvas ? 'auto' : 'none', 'important')
    canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
    if (!showCanvas) {
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
    }
    console.log(`🎛️ Canvas ${showCanvas ? 'visível' : 'oculto'} (opacity ${targetOpacity})`)
  }

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
      
      // Garantir que o canvas seja transparente
      if (sceneRef.current) {
        const scene = sceneRef.current
        const canvas = scene.querySelector('canvas')
        if (canvas) {
          // Forçar transparência via WebGL
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
          if (gl) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: transparente
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            console.log('✅ Canvas WebGL configurado para transparência após permissão')
          }
          
          // Forçar transparência via CSS
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
    // Controlar volume de todos os vídeos AR que têm áudio (video2 e video3)
    const video2 = document.getElementById('video2')
    const video3 = document.getElementById('video3')

    if (audioActive) {
      // Audiodescrição ativa: reduzir volume dos vídeos para 0.3 (30%)
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
        
        // Mutar apenas video1, video2 e video3 devem ter áudio
        if (video.id === 'video1') {
          video.muted = true
        } else {
          video.muted = false // video2 e video3 com áudio
        }
        
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
      
      // Só mutar video1, video2 e video3 devem ter áudio
      if (video.id === 'video1') {
        video.muted = true
      } else {
        video.muted = false // video2 e video3 com áudio
      }
      
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

    // Função global para garantir que o renderer seja transparente
    const makeRendererTransparent = () => {
      const canvas = scene.querySelector('canvas')
      if (!canvas) {
        return false
      }

      // FORÇAR CSS transparente com !important via setProperty
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      
      // Também garantir via style direto
      canvas.style.backgroundColor = 'transparent'
      canvas.style.background = 'transparent'
      canvas.style.opacity = '1'
      
      let rendererFound = false
      
      // Tentar acessar renderer via sistema do A-Frame
      try {
        const rendererSystem = scene.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer && typeof renderer.setClearColor === 'function') {
            // Interceptar setClearColor para sempre forçar alpha 0
            if (!renderer._originalSetClearColor) {
              renderer._originalSetClearColor = renderer.setClearColor.bind(renderer)
              renderer.setClearColor = function(color, alpha) {
                // Sempre forçar alpha 0 (transparente)
                renderer._originalSetClearColor(color, 0)
              }
            }
            
            // Configurar clearColor para transparente
            renderer.setClearColor(0x000000, 0) // Preto com alpha 0 (transparente)
            renderer.setPixelRatio(window.devicePixelRatio || 1)
            
            // Garantir que o renderer está configurado para alpha
            if (renderer.domElement) {
              const gl = renderer.getContext()
              if (gl) {
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                gl.clearColor(0.0, 0.0, 0.0, 0.0) // Forçar transparente
              }
            }
            
            console.log('✅ Renderer configurado como transparente via scene.systems')
            rendererFound = true
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao acessar renderer via scene.systems:', e.message)
      }
      
      // Tentar via AFRAME global
      if (window.AFRAME) {
        try {
          const scenes = AFRAME.scenes || []
          for (const aframeScene of scenes) {
            const rendererSystem = aframeScene?.systems?.renderer
            if (rendererSystem) {
              const renderer = rendererSystem.renderer || rendererSystem
              if (renderer && typeof renderer.setClearColor === 'function') {
                renderer.setClearColor(0x000000, 0)
                
                // Garantir que o renderer está configurado para alpha
                if (renderer.domElement) {
                  const gl = renderer.getContext()
                  if (gl) {
                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                  }
                }
                
                if (!rendererFound) {
                  console.log('✅ Renderer configurado como transparente via AFRAME.scenes')
                  rendererFound = true
                }
              }
            }
          }
        } catch (e) {
          console.log('⚠️ Erro ao acessar renderer via AFRAME:', e.message)
        }
      }
      
      // Tentar acessar diretamente via THREE.js se disponível
      if (window.THREE && canvas) {
        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
          if (gl) {
            // Forçar limpar o canvas com alpha transparente
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            // NÃO chamar gl.clear() - isso causa piscar, deixa o A-Frame fazer isso
            console.log('✅ Canvas WebGL configurado para transparência')
          }
        } catch (e) {
          // Ignorar
        }
      }
      
      return rendererFound
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
        // Só mutar video1, video2 e video3 devem ter áudio
        if (video.id === 'video1') {
          video.muted = true
        } else {
          video.muted = false // video2 e video3 com áudio
        }
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
      // Apenas garantir transparência do canvas - NÃO tocar no vídeo
      // O MindAR gerencia completamente o vídeo da câmera
      makeRendererTransparent()
      return false // Não fazer nada com o vídeo - o MindAR gerencia tudo
    }
    ensureCameraVideoVisibleRef.current = ensureCameraVideoVisible
    
    // Iniciar verificação periódica da câmera após a função ser definida
    if (!initialCameraCheckRef.current) {
      initialCameraCheckRef.current = setInterval(() => {
        if (ensureCameraVideoVisibleRef.current) {
          const found = ensureCameraVideoVisibleRef.current()
          if (found) {
            console.log('✅ Câmera encontrada e configurada! Parando verificação inicial...')
            if (initialCameraCheckRef.current) {
              clearInterval(initialCameraCheckRef.current)
              initialCameraCheckRef.current = null
            }
          }
        }
      }, 500) // Verificar a cada 500ms
    }
    
    // REMOVIDO: MutationObserver - deixar o MindAR gerenciar completamente
    // Não precisamos observar mudanças - o MindAR gerencia tudo

    // NÃO interceptar o loop de renderização - o MindAR precisa gerenciar isso normalmente
    // Apenas configurar transparência uma vez no início
    const configureRenderer = () => {
      try {
        const rendererSystem = scene.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer) {
            // Configurar clear color transparente APENAS uma vez
            if (typeof renderer.setClearColor === 'function') {
              renderer.setClearColor(0x000000, 0)
              console.log('✅ Renderer configurado para transparência')
            }
            
            // Configurar WebGL context APENAS uma vez
            if (renderer.domElement) {
              const canvas = renderer.domElement
              const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
              if (gl) {
                // Configurar clear color transparente APENAS uma vez
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                console.log('✅ WebGL context configurado para transparência')
              }
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao configurar renderer:', e.message)
      }
    }
    
    // Chamar apenas uma vez após o AR estar pronto
    if (isArReady) {
      configureRenderer()
    }

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
        
        // Target 0 - Habilitar vídeo quando target for encontrado
        if (target0) {
          target0.addEventListener('targetFound', async () => {
            console.log('🎯 Target 0 encontrado!')
            setActiveTargetIndex(0)
            setShowScanningAnimation(false)
            
            // Habilitar e reproduzir o vídeo AR
            const video = document.getElementById('video1')
            if (video) {
              console.log('🎥 Habilitando vídeo AR para target 0:', video.id)
              try {
                await ensureVideoSourceAvailable(video)
                if (video.readyState === 0) {
                  video.load()
                }
                video.muted = true
                enableVideo(video)
                
                // Garantir que o a-video esteja visível
                const videoPlane = target0.querySelector('a-video')
                if (videoPlane) {
                  videoPlane.setAttribute('visible', 'true')
                  console.log('✅ a-video do target 0 tornado visível')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 0:', e)
              }
            }
          })
          
          target0.addEventListener('targetLost', () => {
            console.log('❌ Target 0 perdido')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            const video = document.getElementById('video1')
            if (video) {
              video.pause()
            }
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
                
                // Garantir que o a-video esteja visível
                const videoPlane = target1.querySelector('a-video')
                if (videoPlane) {
                  videoPlane.setAttribute('visible', 'true')
                  console.log('✅ a-video do target 1 tornado visível')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 1:', e)
              }
            }
          })
          
          target1.addEventListener('targetLost', () => {
            console.log('❌ Target 1 perdido')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            const video = document.getElementById('video2')
            if (video) {
              video.pause()
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
                
                // Garantir que o a-video esteja visível
                const videoPlane = target2.querySelector('a-video')
                if (videoPlane) {
                  videoPlane.setAttribute('visible', 'true')
                  console.log('✅ a-video do target 2 tornado visível')
                }
              } catch (e) {
                console.error('❌ Erro ao habilitar vídeo para target 2:', e)
              }
            }
          })
          
          target2.addEventListener('targetLost', () => {
            console.log('❌ Target 2 perdido')
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            
            const video = document.getElementById('video3')
            if (video) {
              video.pause()
            }
          })
        }
      }, 2000)
    }
    
    // Aguardar o A-Frame carregar completamente e então configurar listeners
    scene.addEventListener('loaded', handleSceneLoaded)
    
    // Função SIMPLIFICADA: Apenas garantir que o canvas seja transparente
    // O MindAR gerencia completamente o vídeo da câmera - não interferimos
    const forceCanvasTransparency = () => {
      const canvas = scene.querySelector('canvas')
      if (!canvas) return
      
      // CSS transparente
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('z-index', '1', 'important') // Acima do vídeo (-1)
      canvas.style.setProperty('position', 'fixed', 'important')
      canvas.style.setProperty('top', '0', 'important')
      canvas.style.setProperty('left', '0', 'important')
      canvas.style.setProperty('width', '100vw', 'important')
      canvas.style.setProperty('height', '100vh', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
          
      // Renderer transparente - CRÍTICO
      try {
        const rendererSystem = scene.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer) {
            // Interceptar setClearColor para sempre forçar alpha 0
            if (typeof renderer.setClearColor === 'function' && !renderer._transparencyIntercepted) {
              renderer._originalSetClearColor = renderer.setClearColor.bind(renderer)
              renderer.setClearColor = function(color, alpha) {
                // Sempre forçar alpha 0 (transparente)
                renderer._originalSetClearColor(color, 0)
              }
              renderer._transparencyIntercepted = true
            }
            
            // Configurar clearColor para transparente
            if (typeof renderer.setClearColor === 'function') {
              renderer.setClearColor(0x000000, 0) // Preto com alpha 0 (transparente)
            }
            
            // Interceptar render() para garantir transparência a cada frame
            if (typeof renderer.render === 'function' && !renderer._renderIntercepted) {
              renderer._originalRender = renderer.render.bind(renderer)
              renderer.render = function(scene, camera) {
                // CRÍTICO: Garantir clearColor transparente antes de renderizar
                if (typeof renderer.setClearColor === 'function') {
                  renderer.setClearColor(0x000000, 0)
                }
                // CRÍTICO: Garantir WebGL clearColor transparente diretamente
                try {
                  const gl = renderer.getContext && renderer.getContext() || 
                            renderer.domElement && (renderer.domElement.getContext('webgl') || renderer.domElement.getContext('webgl2'))
                  if (gl) {
                    gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: totalmente transparente
                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                  }
                } catch (e) {
                  // Ignorar erro se não conseguir acessar WebGL
                }
                // Chamar render original
                renderer._originalRender(scene, camera)
              }
              renderer._renderIntercepted = true
            }
            
            // Garantir que alpha seja habilitado
            if (typeof renderer.setClearAlpha === 'function') {
              renderer.setClearAlpha(0)
            }
            // Forçar renderização com alpha
            if (renderer.domElement) {
              renderer.domElement.style.backgroundColor = 'transparent'
            }
          }
        }
        
        // Também configurar via WebGL diretamente
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        if (gl) {
          gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: transparente
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        }
      } catch (e) {
        console.warn('⚠️ Erro ao configurar transparência:', e)
      }
    }
    
    // Loop para forçar transparência continuamente
    if (transparencyIntervalRef.current) {
      clearInterval(transparencyIntervalRef.current)
    }
    // Loop para garantir que o canvas seja transparente E o vídeo do MindAR esteja visível
    transparencyIntervalRef.current = setInterval(() => {
      forceCanvasTransparency()
      makeRendererTransparent()
      
      // Verificar se o MindAR criou o vídeo da câmera e garantir que esteja visível
      // NÃO mover ou manipular o vídeo, apenas garantir visibilidade básica
      if (cameraPermissionGranted) {
        const mindarVideo = document.querySelector('#arVideo') || 
                           Array.from(document.querySelectorAll('video')).find(v => {
                             const id = v.id || ''
                             if (['video1', 'video2', 'video3'].includes(id)) return false
                             // Verificar se é o vídeo da câmera (tem stream mas não tem src)
                             return (v.videoWidth > 0 || v.srcObject) && !v.src
                           })
        
        if (mindarVideo) {
          // Garantir visibilidade e posicionamento correto do vídeo
          const computedStyle = window.getComputedStyle(mindarVideo)
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
            console.log('🔧 Garantindo visibilidade do vídeo do MindAR')
            mindarVideo.style.setProperty('display', 'block', 'important')
            mindarVideo.style.setProperty('visibility', 'visible', 'important')
            mindarVideo.style.setProperty('opacity', '1', 'important')
          }
          
          // CRÍTICO: Verificar se o vídeo tem stream e está reproduzindo
          const hasStream = !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0)
          const isPlaying = !mindarVideo.paused && !mindarVideo.ended
          
          // Se o vídeo tem stream mas não está reproduzindo, forçar reprodução
          if (hasStream && mindarVideo.paused && mindarVideo.readyState >= 2) {
            console.log('🔧 Vídeo tem stream mas está pausado - forçando reprodução...')
            mindarVideo.play().catch(e => {
              console.warn('⚠️ Erro ao tentar reproduzir vídeo da câmera:', e)
            })
          }
          
          // Log detalhado apenas na primeira vez ou se houver problemas
          if (!mindarVideo.dataset.logged || !hasStream || mindarVideo.paused) {
            console.log('📹 Status do vídeo da câmera:', {
              hasStream,
              hasSrcObject: !!mindarVideo.srcObject,
              videoWidth: mindarVideo.videoWidth,
              videoHeight: mindarVideo.videoHeight,
              isPlaying,
              paused: mindarVideo.paused,
              readyState: mindarVideo.readyState,
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity
            })
            mindarVideo.dataset.logged = 'true'
          }
          
          // CRÍTICO: Verificar se já foi ajustado (usar flag no elemento)
          const alreadyAdjusted = mindarVideo.dataset.adjusted === 'true'
          
          // Verificar se precisa ajustar comparando com o tamanho da viewport
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          const currentWidth = parseInt(computedStyle.width) || 0
          const currentHeight = parseInt(computedStyle.height) || 0
          const widthDiff = Math.abs(currentWidth - viewportWidth)
          const heightDiff = Math.abs(currentHeight - viewportHeight)
          
          // Verificar também se os estilos inline estão corretos
          const inlineWidth = mindarVideo.style.width
          const inlineHeight = mindarVideo.style.height
          const inlinePosition = mindarVideo.style.position
          
          const needsResize = !alreadyAdjusted || 
                              inlinePosition !== 'fixed' || 
                              (inlineWidth !== '100vw' && inlineWidth !== '') ||
                              (inlineHeight !== '100vh' && inlineHeight !== '') ||
                              widthDiff > 50 || // Mais de 50px de diferença
                              heightDiff > 50
          
          if (needsResize) {
            console.log('🔧 Ajustando posição do vídeo para fixed e cobrindo tela', {
              currentWidth: computedStyle.width,
              currentHeight: computedStyle.height,
              inlineWidth,
              inlineHeight,
              viewportWidth,
              viewportHeight
            })
            
            // Aplicar todos os estilos necessários
            mindarVideo.style.position = 'fixed'
            mindarVideo.style.top = '0'
            mindarVideo.style.left = '0'
            mindarVideo.style.width = '100vw'
            mindarVideo.style.height = '100vh'
            mindarVideo.style.objectFit = 'cover'
            mindarVideo.style.zIndex = '-2'
            mindarVideo.style.margin = '0'
            mindarVideo.style.padding = '0'
            
            // Também usar setProperty para garantir prioridade
            mindarVideo.style.setProperty('position', 'fixed', 'important')
            mindarVideo.style.setProperty('top', '0', 'important')
            mindarVideo.style.setProperty('left', '0', 'important')
            mindarVideo.style.setProperty('width', '100vw', 'important')
            mindarVideo.style.setProperty('height', '100vh', 'important')
            mindarVideo.style.setProperty('object-fit', 'cover', 'important')
            mindarVideo.style.setProperty('z-index', '-2', 'important')
            
            mindarVideo.dataset.adjusted = 'true' // Marcar como ajustado
            
            // Verificar novamente após aplicar
            setTimeout(() => {
              const newComputedStyle = window.getComputedStyle(mindarVideo)
              console.log('✅ Vídeo ajustado para cobrir toda a tela', {
                width: newComputedStyle.width,
                height: newComputedStyle.height,
                position: newComputedStyle.position,
                inlineWidth: mindarVideo.style.width,
                inlineHeight: mindarVideo.style.height
              })
            }, 100)
          }
          
          // Verificar se o vídeo está realmente atrás do canvas
          const canvas = scene.querySelector('canvas')
          if (canvas) {
            const canvasZ = parseInt(window.getComputedStyle(canvas).zIndex) || 0
            const videoZ = parseInt(computedStyle.zIndex) || 0
            
            if (canvasZ <= videoZ) {
              console.log('⚠️ Canvas pode estar cobrindo o vídeo - canvas z-index:', canvasZ, 'vídeo z-index:', videoZ)
            }
          }
        }
      }
    }, 500) // Verificar a cada 500ms
    
      // Adicionar listener para quando o AR estiver pronto
    scene.addEventListener('arReady', () => {
      console.log('✅ MindAR pronto! O MindAR gerencia a câmera completamente.')
      setIsArReady(true)
      
      // Verificar se o MindAR criou o vídeo da câmera e garantir visibilidade
      setTimeout(() => {
        const mindarVideo = document.querySelector('#arVideo') || 
                           Array.from(document.querySelectorAll('video')).find(v => {
                             const id = v.id || ''
                             if (['video1', 'video2', 'video3'].includes(id)) return false
                             return (v.videoWidth > 0 || v.srcObject) && !v.src
                           })
        
        if (mindarVideo) {
          const computedStyle = window.getComputedStyle(mindarVideo)
          
          // ANÁLISE PROFUNDA: Verificar todos os aspectos do vídeo
          const hasStream = !!(mindarVideo.srcObject || mindarVideo.getAttribute('src'))
          const isPlaying = !mindarVideo.paused && !mindarVideo.ended && mindarVideo.readyState > 2
          const hasVideoTrack = mindarVideo.srcObject?.getVideoTracks?.().length > 0
          
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
            // ANÁLISE CRÍTICA:
            hasStream: hasStream,
            hasSrcObject: !!mindarVideo.srcObject,
            srcObject: mindarVideo.srcObject,
            isPlaying: isPlaying,
            paused: mindarVideo.paused,
            ended: mindarVideo.ended,
            readyState: mindarVideo.readyState,
            hasVideoTrack: hasVideoTrack,
            networkState: mindarVideo.networkState,
            error: mindarVideo.error,
            // Verificar parent e siblings
            parent: mindarVideo.parentElement?.tagName,
            nextSibling: mindarVideo.nextElementSibling?.tagName,
            previousSibling: mindarVideo.previousElementSibling?.tagName
          })
          
          // Verificar se o vídeo tem stream mas não está visível
          if (hasStream && !isPlaying && mindarVideo.readyState === 0) {
            console.warn('⚠️ Vídeo tem stream mas não está carregado! Tentando forçar play...')
            mindarVideo.play().catch(e => {
              console.error('❌ Erro ao tentar reproduzir vídeo da câmera:', e)
            })
          }
          
          // Verificar se há elementos cobrindo o vídeo
          const canvas = scene.querySelector('canvas')
          if (canvas) {
            const canvasStyle = window.getComputedStyle(canvas)
            console.log('📊 Verificação de z-index:', {
              videoZIndex: computedStyle.zIndex,
              canvasZIndex: canvasStyle.zIndex,
              videoPosition: computedStyle.position,
              canvasPosition: canvasStyle.position,
              canvasBackgroundColor: canvasStyle.backgroundColor,
              canvasOpacity: canvasStyle.opacity,
              canvasDisplay: canvasStyle.display,
              canvasVisibility: canvasStyle.visibility
            })
            
            // Se o canvas tiver z-index maior ou igual ao vídeo, pode estar cobrindo
            const videoZ = parseInt(computedStyle.zIndex) || 0
            const canvasZ = parseInt(canvasStyle.zIndex) || 0
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
            
            // Verificar elementos entre vídeo e canvas
            const allElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)
            const videoIndex = allElements.indexOf(mindarVideo)
            const canvasIndex = allElements.indexOf(canvas)
            if (canvasIndex < videoIndex) {
              console.warn('⚠️ Canvas está na frente do vídeo no stacking context!', {
                videoIndex,
                canvasIndex,
                elementsBetween: allElements.slice(canvasIndex, videoIndex).map(el => ({
                  tag: el.tagName,
                  zIndex: window.getComputedStyle(el).zIndex,
                  position: window.getComputedStyle(el).position
                }))
              })
            }
          }
          
          // Verificar se há outros elementos cobrindo
          const bodyChildren = Array.from(document.body.children)
          const coveringElements = bodyChildren.filter(child => {
            if (child === mindarVideo || child === scene) return false
            const style = window.getComputedStyle(child)
            const zIndex = parseInt(style.zIndex) || 0
            const videoZ = parseInt(computedStyle.zIndex) || -2
            return zIndex > videoZ && 
                   style.position !== 'static' && 
                   (style.display !== 'none' && style.visibility !== 'hidden')
          })
          
          if (coveringElements.length > 0) {
            console.warn('⚠️ Elementos que podem estar cobrindo o vídeo:', coveringElements.map(el => ({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              zIndex: window.getComputedStyle(el).zIndex,
              position: window.getComputedStyle(el).position
            })))
          }
        } else {
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
      
      // GARANTIR que o a-scene esteja visível
      if (scene) {
        scene.style.setProperty('opacity', '1', 'important')
        scene.style.setProperty('z-index', '1', 'important') // Acima do vídeo (-1), mas transparente
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
        scene.style.setProperty('position', 'fixed', 'important')
        scene.style.setProperty('top', '0', 'important')
        scene.style.setProperty('left', '0', 'important')
        scene.style.setProperty('width', '100vw', 'important')
        scene.style.setProperty('height', '100vh', 'important')
        console.log('✅ a-scene configurado como visível após arReady')
        
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
    })

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
        scene.removeEventListener('arReady', () => {})
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

      {/* A-Frame Scene */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 0; autoStart: false; showStats: false; uiScanning: none; uiLoading: none; uiError: none;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer="colorManagement: true; physicallyCorrectLights: true; antialias: true; alpha: true; precision: highp; logarithmicDepthBuffer: true; preserveDrawingBuffer: true"
        embedded
        background="color: #000000; opacity: 0"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1, // Acima do vídeo da câmera (-1), mas transparente
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          opacity: 1
        }}
      >
        {/* Assets - Vídeos */}
        <a-assets>
          <video id="video1" src="/ayamioja-ra/ar-assets/assets/ayo_teste.mp4" preload="auto" crossOrigin="anonymous"></video>
          <video id="video2" src="/ayamioja-ra/ar-assets/assets/anim_3.mp4" preload="auto" crossOrigin="anonymous" loop muted={false}></video>
          {/* video3 usando anim_2.mp4 novamente (ou você pode adicionar um terceiro vídeo) */}
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
            visible="true"
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
            visible="true"
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
            visible="true"
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
