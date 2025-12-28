import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ToggleControls from '../components/ToggleControls'
// import InterpreterVideo from '../components/InterpreterVideo' // DESATIVADO - vídeo de libras desativado
import SafeImage from '../components/SafeImage'
import AudioDescriptionAR from '../components/AudioDescriptionAR'

// REMOVIDO: Interceptação de getContext e WebGL - A-Frame gerencia isso corretamente

// Função para detectar Android 10+
const detectAndroidVersion = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  const androidMatch = userAgent.match(/Android\s([0-9\.]*)/)
  if (androidMatch && androidMatch[1]) {
    const version = parseFloat(androidMatch[1])
    return version >= 10
  }
  return false
}

// Função para obter configuração do MindAR baseada na plataforma
// iOS e outros dispositivos usam configuração padrão
// Apenas Android 10+ Chrome recebe configuração otimizada
const getMindARConfig = () => {
  const isAndroid10Plus = detectAndroidVersion()
  const isChromeAndroid = /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent)
  
  // Configuração padrão (iOS, Android < 10, outros navegadores)
  let config = {
    filterMinCF: 0.0001,
    filterBeta: 0.001,
    warmupTolerance: 5,
    missTolerance: 0
  }
  
  // Android 10+ no Chrome: ajustes para melhor detecção em condições variáveis
  // NÃO afeta iOS - iOS usa configuração padrão acima
  if (isAndroid10Plus && isChromeAndroid) {
    config = {
      filterMinCF: 0.0001,      // Mantém baixo para detecção mais sensível
      filterBeta: 0.05,         // Aumentado de 0.001 para 0.05 - mais responsivo a mudanças
      warmupTolerance: 3,       // Reduzido de 5 para 3 - detecta mais rápido
      missTolerance: 10,        // Aumentado de 0 para 10 - mais tolerante a perdas temporárias
    }
    console.log('📱 Configuração MindAR otimizada para Android 10+ Chrome (iOS não afetado)')
  } else {
    console.log('📱 Configuração MindAR padrão (iOS e outros dispositivos)')
  }
  
  return config
}

const ScanPage = () => {
  // Obter configuração do MindAR (específica para Android 10+ Chrome, padrão para iOS)
  const mindarConfig = getMindARConfig()
  // REMOVIDO: Todas as interceptações de console/erros
  // Essas interceptações estavam criando problemas, não resolvendo
  // Deixar o A-Frame/MindAR trabalhar naturalmente
  const [librasActive, setLibrasActive] = useState(true) // ✅ Iniciar com Libras ativado
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [activeTargetIndex, setActiveTargetIndex] = useState(null)
  // Ref para acessar activeTargetIndex dentro de closures (setInterval, requestAnimationFrame)
  const activeTargetIndexRef = useRef(null)
  
  // Atualizar ref sempre que activeTargetIndex mudar
  useEffect(() => {
    activeTargetIndexRef.current = activeTargetIndex
  }, [activeTargetIndex])
  
  const [arVideoStates, setArVideoStates] = useState({})
  const [isArReady, setIsArReady] = useState(false)
  const [showScanningAnimation, setShowScanningAnimation] = useState(true)
  // const [currentLibrasVideo, setCurrentLibrasVideo] = useState(null) // DESATIVADO - vídeo de libras desativado
  const [deviceOrientation, setDeviceOrientation] = useState('portrait') // 'portrait' ou 'landscape'
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false) // Controla se a permissão da câmera foi concedida
  const [isRequestingPermission, setIsRequestingPermission] = useState(false) // Controla se está solicitando permissão
  
  const sceneRef = useRef(null)
  // REMOVIDO: mindarStartedRef - não precisamos mais rastrear inicialização manual
  // O MindAR inicia automaticamente com autoStart: true

  const navigate = useNavigate()

  const handleLibrasToggle = (active) => {
    setLibrasActive(active)
    console.log('Toggle Libras:', active)
  }

  const handleAudioToggle = (active) => {
    setAudioActive(active)
    console.log('Toggle Audio:', active)
  }

  // REMOVIDO: updateCanvasVisibility - NÃO tocar no canvas
  // Apenas z-index do a-scene é controlado, nunca o canvas

  const handleBackClick = () => {
    // Garantir que a URL tenha a barra no final para carregar o background corretamente
    const baseUrl = window.location.origin
    window.location.href = `${baseUrl}/ayamioja-ra/`
  }

  // REMOVIDO: startMindAR() - causa inicialização dupla do WebGL
  // O MindAR já inicia automaticamente com autoStart: true no a-scene
  // Chamar startMindAR() manualmente tenta criar segundo WebGLRenderer → erro

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
      // REMOVIDO: startMindAR() - causa inicialização dupla do WebGL
      // O MindAR já inicia automaticamente com autoStart: true no a-scene
      console.log('✅ Permissão da câmera concedida - MindAR iniciará automaticamente com autoStart: true')
      
      // CRÍTICO: Tentar forçar inicialização do MindAR após permissão da câmera
      setTimeout(() => {
        const scene = sceneRef.current
        if (scene) {
          const mindarSystem = scene.systems && scene.systems['mindar-image-system']
          if (mindarSystem && mindarSystem.el) {
            const mindarComponent = mindarSystem.el.components && mindarSystem.el.components['mindar-image']
            console.log('🔄 Tentando iniciar MindAR após permissão da câmera...', {
              hasComponent: !!mindarComponent,
              hasStart: !!(mindarComponent && mindarComponent.start),
              componentKeys: mindarComponent ? Object.keys(mindarComponent) : null
            })
            
            if (mindarComponent) {
              // Tentar múltiplas formas de iniciar
              if (mindarComponent.start) {
                try {
                  mindarComponent.start()
                  console.log('✅ MindAR.start() chamado com sucesso')
                } catch (e) {
                  console.warn('⚠️ Erro ao chamar mindarComponent.start():', e)
                }
              }
              
              // Tentar via el
              if (mindarComponent.el) {
                try {
                  const elComponent = mindarComponent.el.components['mindar-image']
                  if (elComponent && elComponent.start) {
                    elComponent.start()
                    console.log('✅ MindAR.start() chamado via el')
                  }
                } catch (e) {
                  console.warn('⚠️ Erro ao chamar via el:', e)
                }
              }
              
              // Tentar via sistema
              if (mindarSystem.start) {
                try {
                  mindarSystem.start()
                  console.log('✅ MindAR.start() chamado via system')
                } catch (e) {
                  console.warn('⚠️ Erro ao chamar mindarSystem.start():', e)
                }
              }
            }
          }
        }
      }, 1500)
      
      setCameraPermissionGranted(true)
      
      // CRÍTICO: Aguardar o vídeo receber o stream da câmera
      // O MindAR pode demorar um pouco para atribuir o stream ao vídeo
      console.log('⏳ Aguardando vídeo receber stream da câmera...')
      let videoWithStream = null
      for (let i = 0; i < 50; i++) { // Aguardar até 5 segundos (50 * 100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
        const video = document.querySelector('#arVideo') || 
                     Array.from(document.querySelectorAll('video')).find(v => 
                       v.id !== 'video1' && v.id !== 'video2' && v.id !== 'video3'
                     )
        if (video && (video.srcObject || video.videoWidth > 0)) {
          videoWithStream = video
          console.log('✅ Vídeo recebeu stream da câmera:', {
            id: video.id,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            hasSrcObject: !!video.srcObject,
            readyState: video.readyState
          })
          break
        }
      }
      
      if (!videoWithStream) {
        console.warn('⚠️ Vídeo não recebeu stream após 5 segundos - pode haver problema com MindAR')
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
      
      // CRÍTICO: Garantir background transparente quando animação aparece
      document.body.style.setProperty('background-color', 'transparent', 'important')
      document.body.style.setProperty('background', 'transparent', 'important')
      document.documentElement.style.setProperty('background-color', 'transparent', 'important')
      document.documentElement.style.setProperty('background', 'transparent', 'important')
      
      const scanPage = document.querySelector('.scan-page')
      if (scanPage) {
        scanPage.style.setProperty('background-color', 'transparent', 'important')
        scanPage.style.setProperty('background', 'transparent', 'important')
      }
    }
  }, [activeTargetIndex])

  // SOLUÇÃO CORRETA: Controlar visibilidade APENAS via z-index do a-scene
  // NUNCA tocar no canvas - isso pode quebrar o compositor WebGL no Android
  // Apenas ajustar z-index do a-scene quando activeTargetIndex mudar
  useEffect(() => {
    if (!cameraPermissionGranted) return

    const scene = sceneRef.current
    if (!scene) return

    // CRÍTICO: Garantir que o background permaneça transparente
    // Forçar background transparente sempre que activeTargetIndex mudar
    document.body.style.setProperty('background-color', 'transparent', 'important')
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background-color', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    
    const scanPage = document.querySelector('.scan-page')
    if (scanPage) {
      scanPage.style.setProperty('background-color', 'transparent', 'important')
      scanPage.style.setProperty('background', 'transparent', 'important')
    }

    // CRÍTICO: NÃO tocar no canvas - apenas z-index do a-scene
    // Tocar no canvas (opacity, display) pode quebrar o compositor WebGL
    // Usar !important para garantir que sobrescreva qualquer style inline
    if (activeTargetIndex === null || activeTargetIndex === undefined) {
      // Quando não há target: colocar a-scene atrás do vídeo (z-index: -1)
      scene.style.setProperty('z-index', '-1', 'important')
      scene.removeAttribute('data-has-active-target')
      console.log('📐 a-scene z-index: -1 (atrás do vídeo - sem targets)')
    } else {
      // Quando há target: colocar a-scene acima do vídeo (z-index: 1)
      scene.style.setProperty('z-index', '1', 'important')
      scene.setAttribute('data-has-active-target', 'true')
      console.log('📐 a-scene z-index: 1 (acima do vídeo - target ativo)')
    }
  }, [activeTargetIndex, cameraPermissionGranted])
  
  // Garantir z-index inicial quando a cena carregar
  useEffect(() => {
    if (!cameraPermissionGranted) return
    
    const scene = sceneRef.current
    if (!scene) return
    
    // Aguardar a-scene estar pronto
    const checkScene = setInterval(() => {
      if (scene.hasLoaded) {
        clearInterval(checkScene)
        // Aplicar z-index inicial baseado em activeTargetIndex
        if (activeTargetIndex === null || activeTargetIndex === undefined) {
          scene.style.setProperty('z-index', '-1', 'important')
          scene.removeAttribute('data-has-active-target')
        } else {
          scene.style.setProperty('z-index', '1', 'important')
          scene.setAttribute('data-has-active-target', 'true')
        }
      }
    }, 100)
    
    // Parar após 5 segundos
    setTimeout(() => clearInterval(checkScene), 5000)
    
    return () => clearInterval(checkScene)
  }, [cameraPermissionGranted, activeTargetIndex])
  
  // REMOVIDO: Todas as interceptações e hacks
  // Deixar A-Frame/MindAR gerenciar o canvas completamente

  // Forçar transparência imediatamente ao montar
  useEffect(() => {
    // Forçar body e html transparentes imediatamente
    document.body.style.setProperty('background-color', 'transparent', 'important')
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background-color', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    
    // CRÍTICO: Garantir que #root também seja transparente
    const root = document.getElementById('root')
    if (root) {
      root.style.setProperty('background-color', 'transparent', 'important')
      root.style.setProperty('background', 'transparent', 'important')
    }
    
    // Adicionar classe para CSS específico
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')
    
    // Forçar .scan-page transparente
    const scanPage = document.querySelector('.scan-page')
    if (scanPage) {
      scanPage.style.setProperty('background-color', 'transparent', 'important')
      scanPage.style.setProperty('background', 'transparent', 'important')
    }
    
    // Loop para garantir que background permaneça transparente E vídeo apareça
    // CRÍTICO: Reduzir frequência e evitar alterar canvas quando há target ativo (causa piscar)
    const keepTransparent = setInterval(() => {
      // Forçar background transparente
      document.body.style.setProperty('background-color', 'transparent', 'important')
      document.body.style.setProperty('background', 'transparent', 'important')
      document.documentElement.style.setProperty('background-color', 'transparent', 'important')
      document.documentElement.style.setProperty('background', 'transparent', 'important')
      if (root) {
        root.style.setProperty('background-color', 'transparent', 'important')
        root.style.setProperty('background', 'transparent', 'important')
      }
      if (scanPage) {
        scanPage.style.setProperty('background-color', 'transparent', 'important')
        scanPage.style.setProperty('background', 'transparent', 'important')
      }
      
      // CRÍTICO: Garantir que footer também seja transparente
      const footer = document.querySelector('.scan-footer') || document.querySelector('footer')
      if (footer) {
        footer.style.setProperty('background-color', 'transparent', 'important')
        footer.style.setProperty('background', 'transparent', 'important')
      }
      
      // CRÍTICO: NÃO alterar canvas quando há target ativo - causa piscar
      // Apenas verificar background-color se necessário
      const scene = sceneRef.current
      if (scene) {
        const hasActiveTarget = scene.hasAttribute('data-has-active-target')
        // Se há target ativo, NÃO tocar no canvas - deixar como está
        if (!hasActiveTarget) {
          const canvas = scene.querySelector('canvas')
          if (canvas) {
            // Apenas verificar computed style e forçar se necessário (sem alterar display/opacity)
            const computedStyle = window.getComputedStyle(canvas)
            if (computedStyle.backgroundColor !== 'transparent' && 
                computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              canvas.style.setProperty('background-color', 'transparent', 'important')
              canvas.style.setProperty('background', 'transparent', 'important')
            }
          }
        }
      }
      
      // CRÍTICO: Garantir que vídeo da câmera apareça E ocupe toda a tela E fique acima do canvas quando não há targets
      // Buscar vídeo de múltiplas formas - MindAR pode criar com diferentes IDs
      // CRÍTICO: Encontrar APENAS o vídeo da câmera do MindAR (não os vídeos dos targets AR)
      let arVideo = document.querySelector('#arVideo') || 
                    document.querySelector('video[id^="mindar"]') ||
                    document.querySelector('video[id*="mindar"]') ||
                    Array.from(document.querySelectorAll('video')).find(v => {
                      const id = v.id || ''
                      // Apenas vídeos que NÃO são dos targets AR e que têm srcObject (stream da câmera)
                      return id !== 'video1' && id !== 'video2' && id !== 'video3' &&
                             !id.includes('target') &&
                             (v.srcObject || (v.videoWidth > 0 && !v.src)) // Tem stream OU tem dimensões mas não tem src (é stream)
                    })
      
      // Se não encontrou, tentar encontrar qualquer vídeo que não seja dos targets AR
      if (!arVideo) {
        const allVideos = Array.from(document.querySelectorAll('video'))
        arVideo = allVideos.find(v => {
          const id = v.id || ''
          // Apenas vídeos que têm srcObject (stream da câmera) e não são dos targets
          return !id.includes('video1') && !id.includes('video2') && !id.includes('video3') &&
                 !id.includes('target') &&
                 v.srcObject // CRÍTICO: Deve ter srcObject (stream da câmera)
        })
      }
      
      // CRÍTICO: Ocultar TODOS os outros vídeos que não são o vídeo da câmera
      const allVideos = Array.from(document.querySelectorAll('video'))
      allVideos.forEach(v => {
        const id = v.id || ''
        // Se não é o vídeo da câmera E não é um vídeo de target AR, ocultar
        if (v !== arVideo && 
            id !== 'video1' && id !== 'video2' && id !== 'video3' &&
            !id.includes('target') &&
            !v.srcObject) { // Se não tem srcObject, não é vídeo da câmera
          v.style.setProperty('display', 'none', 'important')
          v.style.setProperty('visibility', 'hidden', 'important')
          v.style.setProperty('opacity', '0', 'important')
        }
      })
      
      if (arVideo) {
        // Remover atributos width/height fixos que impedem fullscreen
        arVideo.removeAttribute('width')
        arVideo.removeAttribute('height')
        
        // Verificar se há target ativo para ajustar z-index
        const scene = sceneRef.current
        const hasActiveTarget = scene && scene.hasAttribute('data-has-active-target')
        // CRÍTICO: Vídeo da câmera sempre deve estar visível, mas atrás do canvas quando há target
        // Quando não há target: vídeo z-index: 1 (acima do canvas que está em -2)
        // Quando há target: vídeo z-index: 0 (atrás do canvas que está em 2)
        const videoZIndex = hasActiveTarget ? '0' : '1' // Quando há target, vídeo fica atrás do canvas
        
        // Forçar estilos para ocupar toda a tela
        arVideo.style.setProperty('display', 'block', 'important')
        arVideo.style.setProperty('visibility', 'visible', 'important')
        arVideo.style.setProperty('opacity', '1', 'important')
        arVideo.style.setProperty('z-index', videoZIndex, 'important')
        arVideo.style.setProperty('position', 'fixed', 'important') // Mudado para fixed para garantir fullscreen
        arVideo.style.setProperty('width', '100vw', 'important')
        arVideo.style.setProperty('height', '100vh', 'important')
        arVideo.style.setProperty('min-width', '100vw', 'important')
        arVideo.style.setProperty('min-height', '100vh', 'important')
        arVideo.style.setProperty('object-fit', 'cover', 'important')
        arVideo.style.setProperty('top', '0', 'important')
        arVideo.style.setProperty('left', '0', 'important')
        arVideo.style.setProperty('right', '0', 'important')
        arVideo.style.setProperty('bottom', '0', 'important')
        arVideo.style.setProperty('padding', '0', 'important')
        arVideo.style.setProperty('margin', '0', 'important')
        arVideo.style.setProperty('border', 'none', 'important')
        arVideo.style.setProperty('background', 'transparent', 'important')
        arVideo.style.setProperty('background-color', 'transparent', 'important')
        arVideo.style.setProperty('transform', 'none', 'important')
        arVideo.style.setProperty('-webkit-transform', 'none', 'important')
        
        // Garantir que o vídeo esteja tocando
        if (arVideo.paused && arVideo.readyState >= 2) {
          arVideo.play().catch(e => console.warn('⚠️ Erro ao tocar vídeo da câmera:', e))
        }
      } else {
        // Log para debug se vídeo não for encontrado
        const allVideos = Array.from(document.querySelectorAll('video'))
        console.log('🔍 Vídeo da câmera não encontrado. Vídeos disponíveis:', allVideos.map(v => ({
          id: v.id,
          src: v.src,
          hasSrcObject: !!v.srcObject,
          videoWidth: v.videoWidth,
          readyState: v.readyState
        })))
      }
      
      // CRÍTICO: NÃO alterar canvas no loop quando há target ativo - causa piscar
      // O canvas é gerenciado pelo useEffect quando activeTargetIndex muda
      // Este loop apenas garante background transparente
      const sceneForCanvas = sceneRef.current
      if (sceneForCanvas) {
        const hasActiveTarget = sceneForCanvas.hasAttribute('data-has-active-target')
        // Se há target ativo, NÃO tocar no canvas - deixar como está (evita piscar)
        if (!hasActiveTarget) {
          const canvas = sceneForCanvas.querySelector('canvas')
          if (canvas) {
            // Apenas quando NÃO há target: ocultar canvas
            const currentDisplay = canvas.style.display || window.getComputedStyle(canvas).display
            const currentOpacity = canvas.style.opacity || window.getComputedStyle(canvas).opacity
            
            // Só alterar se não estiver já oculto (evita alterações desnecessárias)
            if (currentDisplay !== 'none' || currentOpacity !== '0') {
              canvas.style.setProperty('z-index', '-2', 'important')
              canvas.style.setProperty('pointer-events', 'none', 'important')
              canvas.style.setProperty('opacity', '0', 'important')
              canvas.style.setProperty('display', 'none', 'important')
              canvas.style.setProperty('visibility', 'hidden', 'important')
              canvas.style.setProperty('background-color', 'transparent', 'important')
              canvas.style.setProperty('background', 'transparent', 'important')
            }
          }
        }
      }
    }, 500) // Aumentar intervalo de 100ms para 500ms para reduzir piscar
    
    return () => {
      clearInterval(keepTransparent)
      document.body.classList.remove('scan-page-active')
      document.documentElement.classList.remove('scan-page-active')
    }
  }, [])

  // REMOVIDO: Loop agressivo de 100ms
  // Esses loops causam race conditions e interferem com o renderer do A-Frame
  // A transparência já está configurada no renderer e background do a-scene

  // REMOVIDO: Fallback de segurança - A-Frame gerencia transparência via atributos

  // REMOVIDO: Não gerenciar o vídeo manualmente - o MindAR gerencia tudo

  // REMOVIDO: Loop duplicado que estava causando conflitos e piscar
  // O overlay já é gerenciado pelo loop principal em outro useEffect

  // REMOVIDO: Não gerenciar o vídeo manualmente - o MindAR gerencia tudo

  // Função helper para atualizar material de forma segura
  const safeUpdateMaterial = (aVideo, retryCount = 0) => {
    if (!aVideo) return false
    
    // Verificar se o componente material existe
    if (!aVideo.components || !aVideo.components.material) {
      if (retryCount < 5) {
        // Tentar novamente após delay
        setTimeout(() => safeUpdateMaterial(aVideo, retryCount + 1), 100 * (retryCount + 1))
      }
      return false
    }
    
    const material = aVideo.components.material
    const materialData = material.data || {}
    
    // CRÍTICO: Verificar se o material está completamente inicializado
    // O erro "can't access property shader" ocorre quando o material não tem shader definido
    if (!materialData.shader && !material.material) {
      if (retryCount < 5) {
        // Material ainda não inicializado, tentar novamente
        setTimeout(() => safeUpdateMaterial(aVideo, retryCount + 1), 100 * (retryCount + 1))
      }
      return false
    }
    
    // Material está pronto, tentar atualizar com try/catch
    try {
      material.update()
      return true
    } catch (e) {
      console.warn('⚠️ Erro ao atualizar material:', e)
      return false
    }
  }

  // CRÍTICO: Forçar play do vídeo quando target é detectado E garantir visibilidade do a-video
  // CRÍTICO: Pausar vídeo quando target é perdido
  useEffect(() => {
    if (activeTargetIndex === null || activeTargetIndex === undefined) {
      // Nenhum target ativo - pausar TODOS os vídeos AR
      console.log('⏸️ Nenhum target ativo - pausando todos os vídeos AR')
      
      // Pausar todos os vídeos AR (video1, video2, video3)
      for (let i = 0; i < 3; i++) {
        const videoId = `video${i + 1}`
        const video = document.getElementById(videoId)
        if (video) {
          if (!video.paused) {
            video.pause()
            console.log(`⏸️ Vídeo ${videoId} pausado`)
          }
        }
        
        // Também pausar o a-video se existir
        const targetEntity = document.getElementById(`target${i}`)
        if (targetEntity) {
          const aVideo = targetEntity.querySelector('a-video')
          if (aVideo && aVideo.components && aVideo.components.video) {
            const videoComponent = aVideo.components.video
            if (videoComponent.videoEl && !videoComponent.videoEl.paused) {
              videoComponent.videoEl.pause()
              console.log(`⏸️ a-video do target ${i} pausado`)
            }
          }
        }
      }
      
      setVideoState({
        isPlaying: false,
        currentTime: 0
      })
      return
    }

    const videoId = `video${activeTargetIndex + 1}`
    const video = document.getElementById(videoId)
    const targetEntity = document.getElementById(`target${activeTargetIndex}`)
    const aVideo = targetEntity ? targetEntity.querySelector('a-video') : null
    
    if (!video) {
      console.warn(`⚠️ Vídeo ${videoId} não encontrado para target ${activeTargetIndex}`)
      return
    }

    console.log(`🎬 Target ${activeTargetIndex} detectado - forçando play do vídeo ${videoId}`)
    
    // CRÍTICO: Pausar outros vídeos antes de tocar o vídeo do target atual
    for (let i = 0; i < 3; i++) {
      if (i !== activeTargetIndex) {
        const otherVideoId = `video${i + 1}`
        const otherVideo = document.getElementById(otherVideoId)
        if (otherVideo && !otherVideo.paused) {
          otherVideo.pause()
          console.log(`⏸️ Vídeo ${otherVideoId} pausado (outro target ativo)`)
        }
        
        // Também pausar o a-video se existir
        const otherTargetEntity = document.getElementById(`target${i}`)
        if (otherTargetEntity) {
          const otherAVideo = otherTargetEntity.querySelector('a-video')
          if (otherAVideo && otherAVideo.components && otherAVideo.components.video) {
            const otherVideoComponent = otherAVideo.components.video
            if (otherVideoComponent.videoEl && !otherVideoComponent.videoEl.paused) {
              otherVideoComponent.videoEl.pause()
              console.log(`⏸️ a-video do target ${i} pausado (outro target ativo)`)
            }
          }
        }
      }
    }

    // CRÍTICO: Garantir que o a-video seja visível e renderizado
    if (aVideo) {
      console.log(`✅ Garantindo visibilidade do a-video no target ${activeTargetIndex}`)
      
      // CRÍTICO: Garantir que o canvas esteja visível e acima do vídeo da câmera
      // ESPECIALMENTE IMPORTANTE NO iOS/Safari E Android 12+
      const scene = sceneRef.current
      if (scene) {
        const canvas = scene.querySelector('canvas')
        if (canvas) {
          // Android 12+ pode ter problema com retângulo preto - adicionar delay
          const isAndroid = /Android/.test(navigator.userAgent)
          const isAndroid12Plus = detectAndroidVersion() // Reutilizar função existente
          
          // iOS/Safari precisa de z-index muito alto e display/visibility explícitos
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
          const canvasZIndex = isIOS ? '9999' : '3'
          
          // CRÍTICO: Configurar canvas apenas UMA vez quando target é detectado
          // Evitar múltiplas configurações que causam piscar
          const configureCanvasOnce = () => {
            // Verificar se canvas já está configurado corretamente
            const currentZIndex = canvas.style.zIndex || window.getComputedStyle(canvas).zIndex
            const currentDisplay = canvas.style.display || window.getComputedStyle(canvas).display
            const currentOpacity = canvas.style.opacity || window.getComputedStyle(canvas).opacity
            
            // Se já está configurado corretamente, não alterar (evita piscar)
            if (currentZIndex === canvasZIndex && 
                currentDisplay === 'block' && 
                currentOpacity === '1') {
              console.log('✅ Canvas já está configurado corretamente, não alterar')
              return
            }
            
            // Primeiro garantir transparência do WebGL
            try {
              const gl = canvas.getContext('webgl', { alpha: true }) || 
                         canvas.getContext('webgl2', { alpha: true }) || 
                         canvas.getContext('experimental-webgl', { alpha: true })
              if (gl) {
                gl.clearColor(0, 0, 0, 0) // RGBA: transparente
                // Forçar clear imediatamente
                gl.clear(gl.COLOR_BUFFER_BIT)
              }
            } catch (e) {
              console.warn('⚠️ Erro ao configurar WebGL clearColor:', e)
            }
            
            // Depois configurar estilos (apenas se necessário)
            canvas.style.setProperty('z-index', canvasZIndex, 'important')
            canvas.style.setProperty('opacity', '1', 'important')
            canvas.style.setProperty('display', 'block', 'important')
            canvas.style.setProperty('visibility', 'visible', 'important')
            canvas.style.setProperty('position', 'absolute', 'important')
            canvas.style.setProperty('pointer-events', 'auto', 'important')
            canvas.style.setProperty('background-color', 'transparent', 'important')
            canvas.style.setProperty('background', 'transparent', 'important')
            
            console.log(`✅ Canvas configurado (z-index: ${canvasZIndex}, iOS: ${isIOS}, Android12+: ${isAndroid12Plus})`)
          }
          
          // Android 12+ precisa de um pequeno delay para evitar retângulo preto
          // Mas não bloquear se vídeo não estiver pronto - mostrar canvas de qualquer forma
          if (isAndroid12Plus) {
            // Aguardar apenas 2 frames para garantir WebGL está pronto
            // Não bloquear por vídeo - mostrar canvas mesmo se vídeo não estiver pronto
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                configureCanvasOnce()
                // Tentar forçar play do vídeo após mostrar canvas
                if (video && video.paused) {
                  video.play().catch(e => console.warn('⚠️ Erro ao tocar vídeo após mostrar canvas:', e))
                }
              })
            })
          } else {
            configureCanvasOnce()
          }
          
          // iOS específico: forçar também no a-scene
          if (isIOS) {
            scene.style.setProperty('z-index', '9998', 'important')
          }
        }
      }
      
      // Forçar visibilidade primeiro
      aVideo.setAttribute('visible', 'true')
      aVideo.setAttribute('autoplay', 'true')
      
      // Tentar atualizar material de forma segura
      safeUpdateMaterial(aVideo)
      
      // Garantir que o componente video está ativo
      if (aVideo.components && aVideo.components.video) {
        const videoComponent = aVideo.components.video
        if (videoComponent.videoEl) {
          videoComponent.videoEl.play().catch(e => console.warn('⚠️ Erro ao tocar vídeo do a-video:', e))
        }
      }
      
      // Verificar se o objeto 3D está sendo renderizado
      if (aVideo.object3D) {
        aVideo.object3D.visible = true
        console.log(`✅ a-video object3D.visible = true`)
      }
      
      // REMOVIDO: setTimeout que reconfigurava canvas após 200ms
      // Isso estava causando piscar - canvas já está configurado acima
      // Apenas atualizar material se necessário, sem tocar no canvas
      setTimeout(() => {
        if (aVideo.object3D) {
          aVideo.object3D.visible = true
          console.log(`✅ a-video object3D.visible confirmado após delay`)
        }
        // Tentar atualizar material novamente após delay (sem tocar no canvas)
        safeUpdateMaterial(aVideo)
      }, 200)
    } else {
      console.warn(`⚠️ a-video não encontrado no target ${activeTargetIndex}`)
    }

    // Forçar play do vídeo HTML quando target é detectado
    const forcePlayVideo = async () => {
      try {
        console.log(`🎬 Iniciando forcePlayVideo para ${videoId} (readyState: ${video.readyState})`)
        
        // Garantir que o vídeo está configurado corretamente
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        video.playsInline = true
        
        // Mutar apenas video1
        if (video.id === 'video1') {
          video.muted = true
        } else {
          video.muted = false
        }

        // CRÍTICO: Se o vídeo não está carregado, forçar load primeiro
        if (video.readyState === 0 || video.networkState === 3) {
          console.log(`📦 Vídeo ${videoId} não está carregado, forçando load()...`)
          video.load()
        }

        // Se o vídeo não está pronto, aguardar
        if (video.readyState < 2) {
          console.log(`⏳ Vídeo ${videoId} não está pronto (readyState: ${video.readyState}), aguardando...`)
          const canPlayHandler = () => {
            console.log(`✅ Vídeo ${videoId} pronto para tocar (readyState: ${video.readyState})`)
            video.removeEventListener('canplay', canPlayHandler)
            video.removeEventListener('loadeddata', canPlayHandler)
            video.play().then(() => {
              console.log(`✅ Vídeo ${videoId} tocando com sucesso`)
            }).catch(e => console.warn(`⚠️ Erro ao reproduzir ${videoId}:`, e))
          }
          video.addEventListener('canplay', canPlayHandler, { once: true })
          video.addEventListener('loadeddata', canPlayHandler, { once: true })
          
          // Timeout de segurança
          setTimeout(() => {
            video.removeEventListener('canplay', canPlayHandler)
            video.removeEventListener('loadeddata', canPlayHandler)
            if (video.readyState >= 2) {
              console.log(`⏰ Timeout: tentando play do ${videoId} mesmo assim`)
              video.play().then(() => {
                console.log(`✅ Vídeo ${videoId} tocando após timeout`)
              }).catch(e => console.warn(`⚠️ Erro ao reproduzir ${videoId} (timeout):`, e))
            }
          }, 3000)
        } else {
          // Vídeo está pronto, tentar play imediatamente
          console.log(`▶️ Tentando play imediato do ${videoId} (readyState: ${video.readyState})`)
          await video.play().then(() => {
            console.log(`✅ Vídeo ${videoId} tocando imediatamente`)
          }).catch(e => {
            console.warn(`⚠️ Erro ao reproduzir ${videoId}:`, e)
            // Retry após 500ms
            setTimeout(() => {
              video.play().then(() => {
                console.log(`✅ Vídeo ${videoId} tocando após retry`)
              }).catch(e2 => console.warn(`⚠️ Erro no retry de ${videoId}:`, e2))
            }, 500)
          })
        }
      } catch (error) {
        console.error(`❌ Erro ao forçar play do vídeo ${videoId}:`, error)
      }
    }

    forcePlayVideo()

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
    const handlePlay = () => {
      console.log(`✅ Vídeo ${videoId} começou a reproduzir`)
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
    // Supressão de erros já está aplicada no topo do arquivo
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
      scanPage.style.setProperty('backgrounposition: regular; top: 0px; left: -109.875px; z-index: -2; width: 651.75px; height: 869px;d-color', 'transparent', 'important')
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
    
    // REMOVIDO: MutationObserver - não interferir com o ciclo de vida do canvas

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

    // CRÍTICO: Adicionar listeners para eventos do MindAR (targetFound e targetLost)
    // Esses eventos são disparados quando um target é detectado ou perdido
    const setupMindARListeners = () => {
      // Aguardar a-scene estar pronto
      if (!scene.hasLoaded) {
        scene.addEventListener('loaded', setupMindARListeners, { once: true })
        return
      }

      // Obter o sistema MindAR
      const mindarSystem = scene.systems && scene.systems['mindar-image-system']
      if (!mindarSystem) {
        console.warn('⚠️ MindAR system não encontrado, tentando novamente...')
        setTimeout(setupMindARListeners, 500)
        return
      }

      console.log('✅ Configurando listeners do MindAR...', {
        mindarSystem: !!mindarSystem,
        isTracking: mindarSystem.isTracking,
        el: mindarSystem.el
      })

      // Verificar se MindAR está ativo - tentar múltiplas formas de acessar
      console.log('📊 MindAR System completo:', {
        mindarSystem: mindarSystem,
        el: mindarSystem.el,
        isTracking: mindarSystem.isTracking,
        isReady: mindarSystem.isReady,
        allKeys: Object.keys(mindarSystem)
      })
      
      if (mindarSystem.el) {
        const mindarComponent = mindarSystem.el.components && mindarSystem.el.components['mindar-image']
        const mindarData = mindarSystem.el.getAttribute && mindarSystem.el.getAttribute('mindar-image')
        
        console.log('📊 MindAR Component:', {
          component: mindarComponent,
          data: mindarData,
          isTracking: mindarComponent?.isTracking || mindarSystem.isTracking,
          isReady: mindarComponent?.isReady || mindarSystem.isReady,
          targets: mindarComponent?.targets?.length || mindarSystem.targets?.length,
          componentKeys: mindarComponent ? Object.keys(mindarComponent) : null
        })
        
        // Verificar se o arquivo .mind está carregado
        if (mindarData) {
          console.log('📁 MindAR Config:', {
            imageTargetSrc: mindarData.imageTargetSrc,
            maxTrack: mindarData.maxTrack,
            autoStart: mindarData.autoStart
          })
          
          // Verificar se o arquivo .mind está acessível
          const mindFileUrl = mindarData.imageTargetSrc
          if (mindFileUrl) {
            fetch(mindFileUrl, { method: 'HEAD' })
              .then(response => {
                if (response.ok) {
                  console.log(`✅ Arquivo .mind acessível: ${mindFileUrl} (${response.status})`)
                } else {
                  console.error(`❌ Arquivo .mind não acessível: ${mindFileUrl} (${response.status})`)
                }
              })
              .catch(error => {
                console.error(`❌ Erro ao verificar arquivo .mind: ${mindFileUrl}`, error)
              })
          }
        }
        
        // Verificar se MindAR está realmente iniciado
        if (mindarComponent) {
          // Aguardar um pouco e verificar novamente
          setTimeout(() => {
            console.log('📊 MindAR Status após delay:', {
              isTracking: mindarComponent.isTracking,
              isReady: mindarComponent.isReady,
              targets: mindarComponent.targets?.length,
              allComponentKeys: Object.keys(mindarComponent),
              componentData: mindarComponent.data,
              el: mindarComponent.el
            })
            
            // Tentar acessar métodos do MindAR
            if (mindarComponent.start) {
              console.log('✅ Método start() disponível no MindAR')
            }
            if (mindarComponent.stop) {
              console.log('✅ Método stop() disponível no MindAR')
            }
            
            // Verificar se há método para iniciar manualmente
            if (mindarComponent.el && mindarComponent.el.components) {
              const mindarImageComponent = mindarComponent.el.components['mindar-image']
              if (mindarImageComponent && mindarImageComponent.start) {
                console.log('🔄 Tentando iniciar MindAR manualmente...')
                try {
                  mindarImageComponent.start()
                  console.log('✅ MindAR iniciado manualmente')
                } catch (e) {
                  console.warn('⚠️ Erro ao iniciar MindAR manualmente:', e)
                }
              }
            }
          }, 2000)
        }
      }

      // Listener para quando um target é encontrado
      const targetFoundHandler = (event) => {
        console.log('🎯 EVENTO targetFound recebido:', event)
        console.log('📦 Event detail:', event.detail)
        const targetIndex = event.detail?.targetIndex ?? event.detail?.index ?? event.detail?.targetIndex
        console.log('🔍 Target index extraído:', targetIndex)
        
        if (targetIndex !== undefined && targetIndex !== null) {
          console.log(`🎯 Target encontrado: ${targetIndex}`)
          setActiveTargetIndex(targetIndex)
          activeTargetIndexRef.current = targetIndex
          
          // CRÍTICO: Garantir que o a-video dentro do target seja visível
          const targetEntity = document.getElementById(`target${targetIndex}`)
          if (targetEntity) {
            const aVideo = targetEntity.querySelector('a-video')
            if (aVideo) {
              console.log(`✅ a-video encontrado no target ${targetIndex}, garantindo visibilidade`)
              aVideo.setAttribute('visible', 'true')
              // Usar função helper para atualizar material de forma segura
              safeUpdateMaterial(aVideo)
            }
          }
        } else {
          console.warn('⚠️ Target index não encontrado no evento:', event)
        }
      }
      
      scene.addEventListener('targetFound', targetFoundHandler)

      // Listener para quando um target é perdido
      scene.addEventListener('targetLost', (event) => {
        const targetIndex = event.detail?.targetIndex ?? event.detail?.index
        if (targetIndex !== undefined && targetIndex !== null) {
          console.log(`❌ Target perdido: ${targetIndex}`)
          
          // CRÍTICO: Pausar o vídeo do target que foi perdido
          const videoId = `video${targetIndex + 1}`
          const video = document.getElementById(videoId)
          if (video && !video.paused) {
            video.pause()
            console.log(`⏸️ Vídeo ${videoId} pausado (target perdido)`)
          }
          
          // Também pausar o a-video se existir
          const targetEntity = document.getElementById(`target${targetIndex}`)
          if (targetEntity) {
            const aVideo = targetEntity.querySelector('a-video')
            if (aVideo && aVideo.components && aVideo.components.video) {
              const videoComponent = aVideo.components.video
              if (videoComponent.videoEl && !videoComponent.videoEl.paused) {
                videoComponent.videoEl.pause()
                console.log(`⏸️ a-video do target ${targetIndex} pausado (target perdido)`)
              }
            }
          }
          
          // Só limpar se for o target ativo atual
          if (activeTargetIndexRef.current === targetIndex) {
            setActiveTargetIndex(null)
            activeTargetIndexRef.current = null
          }
        }
      })

      // Também verificar eventos nas entidades individuais
      const targets = [
        document.getElementById('target0'),
        document.getElementById('target1'),
        document.getElementById('target2')
      ]

      targets.forEach((target, index) => {
        if (!target) {
          console.warn(`⚠️ Target ${index} não encontrado no DOM`)
          return
        }

        console.log(`✅ Target ${index} encontrado no DOM, adicionando listeners`)

        const entityTargetFoundHandler = (event) => {
          console.log(`🎯 Target ${index} encontrado (via entity)`, event)
          setActiveTargetIndex(index)
          activeTargetIndexRef.current = index
          
          // CRÍTICO: Garantir que o a-video seja visível
          const aVideo = target.querySelector('a-video')
          if (aVideo) {
            console.log(`✅ a-video encontrado no target ${index}, garantindo visibilidade`)
            aVideo.setAttribute('visible', 'true')
            
            // Usar função helper para atualizar material de forma segura
            safeUpdateMaterial(aVideo)
          } else {
            console.warn(`⚠️ a-video não encontrado no target ${index}`)
          }
        }

        target.addEventListener('targetFound', entityTargetFoundHandler)

        target.addEventListener('targetLost', () => {
          console.log(`❌ Target ${index} perdido (via entity)`)
          
          // CRÍTICO: Pausar o vídeo do target que foi perdido
          const videoId = `video${index + 1}`
          const video = document.getElementById(videoId)
          if (video && !video.paused) {
            video.pause()
            console.log(`⏸️ Vídeo ${videoId} pausado (target perdido via entity)`)
          }
          
          // Também pausar o a-video se existir
          const aVideo = target.querySelector('a-video')
          if (aVideo && aVideo.components && aVideo.components.video) {
            const videoComponent = aVideo.components.video
            if (videoComponent.videoEl && !videoComponent.videoEl.paused) {
              videoComponent.videoEl.pause()
              console.log(`⏸️ a-video do target ${index} pausado (target perdido via entity)`)
            }
          }
          
          if (activeTargetIndexRef.current === index) {
            setActiveTargetIndex(null)
            activeTargetIndexRef.current = null
          }
        })
      })

      console.log('✅ Listeners do MindAR configurados')
    }

    // Configurar listeners quando a cena carregar
    setupMindARListeners()

    // Verificar periodicamente se MindAR está detectando targets (para debug)
    const checkMindARStatus = setInterval(() => {
      const mindarSystem = scene.systems && scene.systems['mindar-image-system']
      if (mindarSystem) {
        // Tentar múltiplas formas de acessar propriedades
        const isTracking = mindarSystem.isTracking !== undefined ? mindarSystem.isTracking : 
                         (mindarSystem.el?.components?.['mindar-image']?.isTracking)
        const isReady = mindarSystem.isReady !== undefined ? mindarSystem.isReady :
                       (mindarSystem.el?.components?.['mindar-image']?.isReady)
        const targets = mindarSystem.targets || mindarSystem.el?.components?.['mindar-image']?.targets
        
        console.log('📊 MindAR Status Check:', {
          isTracking: isTracking,
          isReady: isReady,
          hasTargets: !!targets,
          targetsCount: targets?.length || 0,
          system: mindarSystem,
          el: mindarSystem.el
        })
        
        // Verificar se há targets ativos manualmente
        const target0 = document.getElementById('target0')
        const target1 = document.getElementById('target1')
        const target2 = document.getElementById('target2')
        
        if (target0 || target1 || target2) {
          console.log('🎯 Targets no DOM:', {
            target0: !!target0,
            target1: !!target1,
            target2: !!target2
          })
        }
      } else {
        console.warn('⚠️ MindAR system não encontrado no status check')
      }
    }, 2000)

    // Parar após 30 segundos
    setTimeout(() => clearInterval(checkMindARStatus), 30000)

    // Detectar quando MindAR está pronto (simplificado)
    // Marcar como pronto quando a cena carregar OU após timeout curto
    let arReadyMarked = false
    const markArReady = () => {
      if (arReadyMarked) return
      arReadyMarked = true
      console.log('✅ MindAR marcado como pronto')
      setIsArReady(true)
    }

    // Aguardar a-scene carregar
    if (scene.hasLoaded) {
      // Se já está carregado, marcar como pronto após pequeno delay
      setTimeout(markArReady, 1000)
    } else {
      // Aguardar evento loaded
      scene.addEventListener('loaded', () => {
        console.log('✅ a-scene carregado')
        setTimeout(markArReady, 1000)
      }, { once: true })
    }

    // Timeout de segurança: marcar como pronto após 3 segundos mesmo se não detectar
    // Isso evita que a tela fique eternamente em "Carregando AR..."
    setTimeout(() => {
      if (!arReadyMarked) {
        console.warn('⚠️ Timeout de segurança - marcando AR como pronto')
        markArReady()
      }
    }, 3000)

    // REMOVIDO: Loop de verificação de background
    // A transparência já está configurada no renderer e background do a-scene
    // Não precisamos verificar periodicamente
    
    // REMOVIDO: ensureCameraVideoVisible - deixar MindAR gerenciar o vídeo
    
    // REMOVIDO: Verificação inicial da câmera
    // Deixar MindAR gerenciar o vídeo da câmera completamente

    // REMOVIDO: getWebGLContext - NUNCA acessar contexto WebGL manualmente
    // Isso causa erro "Canvas has an existing context of a different type"
    // O A-Frame gerencia o contexto WebGL - não devemos tocá-lo

    // REMOVIDO: makeRendererTransparent - A-Frame gerencia transparência via atributos
  }, [])

  return (
    <div className="scan-page">
      {/* Botão de voltar e ToggleControls - SEMPRE visíveis */}
      <div style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 10000 }}>
        <button 
          onClick={handleBackClick}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Voltar
        </button>
      </div>
      
      <ToggleControls 
        onLibrasToggle={handleLibrasToggle}
        onAudioToggle={handleAudioToggle}
        showLogo={false}
      />

      {/* A-Frame Scene - SEMPRE renderizado (nunca desmontado) */}
      <a-scene 
        ref={sceneRef}
        mindar-image={`imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: ${mindarConfig.filterMinCF}; filterBeta: ${mindarConfig.filterBeta}; warmupTolerance: ${mindarConfig.warmupTolerance}; missTolerance: ${mindarConfig.missTolerance}; autoStart: true; showStats: false; uiScanning: none; uiLoading: none; uiError: none;`}
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer={`alpha: true; antialias: ${mindarConfig.filterBeta > 0.01 ? 'false' : 'true'}; preserveDrawingBuffer: false; colorManagement: false; powerPreference: ${mindarConfig.filterBeta > 0.01 ? 'high-performance' : 'default'}`}
        background="color: transparent"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1, // Iniciar atrás do vídeo - será ajustado dinamicamente pelo useEffect
          pointerEvents: 'none',
          backgroundColor: 'transparent'
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
            material="shader: flat; side: double"
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
            material="shader: flat; side: double"
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
            material="shader: flat; side: double"
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
        <div 
          id="ui-loading" 
          className="ui-loading" 
          style={{ 
            display: 'flex',
            backgroundColor: 'transparent',
            background: 'transparent'
          }}
        >
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando AR...</p>
          </div>
        </div>
      )}

      {/* Botão para solicitar permissão da câmera (se ainda não foi concedida) */}
      {!cameraPermissionGranted && !isRequestingPermission && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100001,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '30px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ color: 'white', fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>
            Para usar a Realidade Aumentada, precisamos acessar sua câmera
          </p>
          <button
            onClick={requestCameraPermission}
            style={{
              padding: '15px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Permitir acesso à câmera
          </button>
        </div>
      )}

      {/* Animação de Scanning - mostra quando AR estiver pronto E não houver target ativo */}
      {isArReady && showScanningAnimation && (activeTargetIndex === null || activeTargetIndex === undefined) && (
        <div className="ar-scanning-overlay">
          <div className="scanning-circles">
            <div className="scanning-circle-outer"></div>
            <div className="scanning-circle-inner"></div>
          </div>
          <p className="scanning-instruction">
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
