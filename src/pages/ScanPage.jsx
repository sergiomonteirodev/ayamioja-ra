import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
// import InterpreterVideo from '../components/InterpreterVideo' // DESATIVADO - vídeo de libras desativado
import SafeImage from '../components/SafeImage'
import AudioDescriptionAR from '../components/AudioDescriptionAR'

// REMOVIDO: Interceptação de getContext e WebGL - A-Frame gerencia isso corretamente

const ScanPage = () => {
  // CRÍTICO ANDROID: Suprimir erro WebGL que está poluindo o console
  // SOLUÇÃO ULTRA AGRESSIVA: Interceptar TODAS as formas possíveis de erro
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) return

    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log
    const originalOnError = window.onerror
    const originalUnhandledRejection = window.onunhandledrejection

    // Função para verificar se é erro WebGL
    const isWebGLError = (message) => {
      if (!message) return false
      const msg = typeof message === 'string' ? message : String(message)
      return msg.includes('WebGL context could not be created') ||
             msg.includes('Canvas has an existing context') ||
             msg.includes('THREE.WebGLRenderer') ||
             msg.includes('existing context of a different type')
    }

    // Interceptar console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (isWebGLError(message)) {
        return // Não logar este erro
      }
      originalError.apply(console, args)
    }

    // Interceptar console.warn
    console.warn = (...args) => {
      const message = args.join(' ')
      if (isWebGLError(message)) {
        return // Não logar este aviso
      }
      originalWarn.apply(console, args)
    }

    // Interceptar console.log (alguns navegadores podem usar log)
    console.log = (...args) => {
      const message = args.join(' ')
      if (isWebGLError(message)) {
        return // Não logar este log
      }
      originalLog.apply(console, args)
    }

    // Interceptar window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (isWebGLError(message) || (error && isWebGLError(error.message))) {
        return true // Suprimir erro
      }
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error)
      }
      return false
    }

    // Interceptar unhandledrejection
    window.onunhandledrejection = (event) => {
      if (event.reason && isWebGLError(event.reason.message || event.reason)) {
        event.preventDefault()
        return
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event)
      }
    }

    // Interceptar addEventListener('error') também
    const originalAddEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'error' && listener) {
        const wrappedListener = function(event) {
          if (event.error && isWebGLError(event.error.message)) {
            return // Não chamar listener para erros WebGL
          }
          if (event.message && isWebGLError(event.message)) {
            return // Não chamar listener para erros WebGL
          }
          return listener.call(this, event)
        }
        return originalAddEventListener.call(this, type, wrappedListener, options)
      }
      return originalAddEventListener.call(this, type, listener, options)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
      window.onerror = originalOnError
      window.onunhandledrejection = originalUnhandledRejection
      EventTarget.prototype.addEventListener = originalAddEventListener
    }
  }, [])
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
  const canvasRemovedRef = useRef(false) // Ref para rastrear se canvas foi removido do DOM
  const canvasBackupRef = useRef(null) // Ref para armazenar backup do canvas removido
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
    // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
    // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
    // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
    if (!showCanvas) {
      // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
      // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
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
    }
  }, [activeTargetIndex])

  // SOLUÇÃO CRÍTICA ANDROID: Remover canvas do DOM quando não há targets ativos
  // SOLUÇÃO ULTRA AGRESSIVA: Remover canvas completamente do DOM em vez de apenas ocultá-lo
  // Isso evita que o A-Frame continue renderizando o canvas mesmo com display: none
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid || !cameraPermissionGranted) return

    const forceCanvasVisibility = () => {
      const scene = sceneRef.current
      if (!scene) return

      let canvas = scene.querySelector('canvas')
      
      // Se canvas não existe mas temos backup, restaurar primeiro
      if (!canvas && canvasBackupRef.current) {
        canvas = canvasBackupRef.current
        if (canvas._originalParent && canvas._originalNextSibling) {
          canvas._originalParent.insertBefore(canvas, canvas._originalNextSibling)
        } else if (canvas._originalParent) {
          canvas._originalParent.appendChild(canvas)
        }
        canvasBackupRef.current = null
        canvasRemovedRef.current = false
      }
      
      if (!canvas) return

      // CRÍTICO: Remover canvas do DOM quando não há targets
      if (activeTargetIndex === null || activeTargetIndex === undefined) {
        // Nenhum target ativo: REMOVER canvas do DOM completamente
        if (!canvasRemovedRef.current && canvas.parentNode) {
          // Armazenar informações para restaurar depois
          canvas._originalParent = canvas.parentNode
          canvas._originalNextSibling = canvas.nextSibling
          canvasBackupRef.current = canvas
          canvasRemovedRef.current = true
          
          // Remover do DOM
          canvas.remove()
          console.log('🗑️ Canvas removido do DOM (sem targets ativos)')
        }
        
        scene.removeAttribute('data-has-active-target')
        // CRÍTICO ANDROID: Ajustar z-index do a-scene para ficar ATRÁS do vídeo quando não há targets
        scene.style.setProperty('z-index', '-1', 'important') // Atrás do vídeo quando não há targets
        scene.style.setProperty('visibility', 'visible', 'important')
        scene.style.setProperty('opacity', '1', 'important')
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
      } else {
        // Target ativo: RESTAURAR canvas no DOM se foi removido
        if (canvasRemovedRef.current && canvasBackupRef.current) {
          canvas = canvasBackupRef.current
          if (canvas._originalParent) {
            if (canvas._originalNextSibling) {
              canvas._originalParent.insertBefore(canvas, canvas._originalNextSibling)
            } else {
              canvas._originalParent.appendChild(canvas)
            }
            console.log('✅ Canvas restaurado no DOM (target ativo detectado)')
          }
          canvasBackupRef.current = null
          canvasRemovedRef.current = false
        }
        
        // Garantir que canvas está visível
        if (canvas && canvas.parentNode) {
          scene.setAttribute('data-has-active-target', 'true')
          canvas.style.setProperty('display', 'block', 'important') // Mostrar quando há target
          canvas.style.setProperty('visibility', 'visible', 'important')
          canvas.style.setProperty('opacity', '1', 'important')
          canvas.style.setProperty('pointer-events', 'none', 'important')
          canvas.style.setProperty('z-index', '1', 'important') // Acima do vídeo para mostrar AR
        }
        
        // CRÍTICO ANDROID: Ajustar z-index do a-scene para ficar ACIMA do vídeo quando há targets
        scene.style.setProperty('z-index', '1', 'important') // Acima do vídeo quando há targets
        scene.style.setProperty('visibility', 'visible', 'important')
        scene.style.setProperty('opacity', '1', 'important')
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
      }
    }

    // Executar imediatamente
    forceCanvasVisibility()
    
    // Executar continuamente a cada 100ms para garantir que o canvas permaneça removido quando necessário
    const interval = setInterval(forceCanvasVisibility, 100)

    return () => {
      clearInterval(interval)
      // Restaurar canvas ao desmontar se foi removido
      if (canvasRemovedRef.current && canvasBackupRef.current) {
        const canvas = canvasBackupRef.current
        if (canvas._originalParent) {
          if (canvas._originalNextSibling) {
            canvas._originalParent.insertBefore(canvas, canvas._originalNextSibling)
          } else {
            canvas._originalParent.appendChild(canvas)
          }
        }
      }
    }
  }, [activeTargetIndex, cameraPermissionGranted])
  
  // CRÍTICO: Interceptar criação do canvas pelo A-Frame e remover do DOM quando não há targets
  // SOLUÇÃO ULTRA AGRESSIVA: Interceptar appendChild para evitar que canvas seja adicionado ao DOM
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) return

    // Interceptar appendChild para capturar canvas sendo adicionado
    const originalAppendChild = Element.prototype.appendChild
    let interceptActive = true

    Element.prototype.appendChild = function(child) {
      // Se for canvas sendo adicionado ao a-scene e não há targets, não adicionar
      if (interceptActive && 
          child.tagName === 'CANVAS' && 
          (this.tagName === 'A-SCENE' || this.closest('a-scene')) &&
          activeTargetIndexRef.current === null) {
        console.log('🚫 Interceptado: Canvas não será adicionado ao DOM (sem targets)')
        // Armazenar canvas para possível uso futuro
        if (!canvasBackupRef.current) {
          canvasBackupRef.current = child
          child._intercepted = true
        }
        return child // Retornar elemento mas não adicionar ao DOM
      }
      return originalAppendChild.call(this, child)
    }

    // Verificar se canvas já existe e remover se necessário
    const existingCanvas = document.querySelector('a-scene canvas')
    if (existingCanvas && activeTargetIndexRef.current === null) {
      if (existingCanvas.parentNode) {
        existingCanvas._originalParent = existingCanvas.parentNode
        existingCanvas._originalNextSibling = existingCanvas.nextSibling
        canvasBackupRef.current = existingCanvas
        canvasRemovedRef.current = true
        existingCanvas.remove()
        console.log('🗑️ Canvas existente removido do DOM')
      }
    }

    // Usar MutationObserver como fallback para detectar canvas criado
    const observer = new MutationObserver((mutations) => {
      if (activeTargetIndexRef.current !== null) return // Se há target, não fazer nada
      
      const canvas = document.querySelector('a-scene canvas')
      if (canvas && canvas.parentNode && !canvas._intercepted) {
        canvas._originalParent = canvas.parentNode
        canvas._originalNextSibling = canvas.nextSibling
        canvasBackupRef.current = canvas
        canvasRemovedRef.current = true
        canvas.remove()
        console.log('🗑️ Canvas detectado e removido via MutationObserver')
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Parar interceptação após 30 segundos (após inicialização)
    setTimeout(() => {
      interceptActive = false
      observer.disconnect()
    }, 30000)

    return () => {
      Element.prototype.appendChild = originalAppendChild
      observer.disconnect()
    }
  }, [])

  // REMOVIDO: Interceptação de criação do canvas - A-Frame gerencia isso corretamente

  // Forçar transparência imediatamente ao montar
  useEffect(() => {
    // Forçar body e html transparentes imediatamente
    document.body.style.setProperty('background-color', 'transparent', 'important')
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background-color', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    
    // Adicionar classe para CSS específico
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')
    
    // Forçar .scan-page transparente
    const scanPage = document.querySelector('.scan-page')
    if (scanPage) {
      scanPage.style.setProperty('background-color', 'transparent', 'important')
      scanPage.style.setProperty('background', 'transparent', 'important')
    }
    
    return () => {
      document.body.classList.remove('scan-page-active')
      document.documentElement.classList.remove('scan-page-active')
    }
  }, [])

  // Forçar transparência Android continuamente - VERSÃO ULTRA AGRESSIVA
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid || !cameraPermissionGranted) return

    const forceAndroidTransparency = () => {
      // Forçar body e html transparentes
      document.body.style.setProperty('background-color', 'transparent', 'important')
      document.body.style.setProperty('background', 'transparent', 'important')
      document.documentElement.style.setProperty('background-color', 'transparent', 'important')
      document.documentElement.style.setProperty('background', 'transparent', 'important')
      
      // Forçar .scan-page transparente
      const scanPage = document.querySelector('.scan-page')
      if (scanPage) {
        scanPage.style.setProperty('background-color', 'transparent', 'important')
        scanPage.style.setProperty('background', 'transparent', 'important')
      }
      
      const scene = sceneRef.current
      if (!scene) return
      
      // Forçar a-scene transparente
      scene.style.setProperty('background-color', 'transparent', 'important')
      scene.style.setProperty('background', 'transparent', 'important')
      scene.setAttribute('background', 'color: transparent')
      
      const canvas = scene.querySelector('canvas')
      if (!canvas) return
      
      // CRÍTICO: Garantir que o canvas esteja oculto quando não há targets ativos
      // Isso evita a área preta no Android
      // Usar display: none para melhor eficácia no Android
      if (activeTargetIndex === null) {
        canvas.style.setProperty('display', 'none', 'important') // display: none é mais eficaz
        canvas.style.setProperty('visibility', 'hidden', 'important') // Fallback
        canvas.style.setProperty('opacity', '0', 'important')
        canvas.style.setProperty('z-index', '-1', 'important') // Atrás do vídeo
        // CRÍTICO ANDROID: Ajustar z-index do a-scene para ficar ATRÁS do vídeo
        scene.style.setProperty('z-index', '-1', 'important') // Atrás do vídeo quando não há targets
      } else {
        canvas.style.setProperty('display', 'block', 'important') // Mostrar quando há target
        canvas.style.setProperty('visibility', 'visible', 'important')
        canvas.style.setProperty('opacity', '1', 'important')
        canvas.style.setProperty('z-index', '1', 'important') // Acima do vídeo para AR
        // CRÍTICO ANDROID: Ajustar z-index do a-scene para ficar ACIMA do vídeo
        scene.style.setProperty('z-index', '1', 'important') // Acima do vídeo quando há targets
      }
      
      // REMOVIDO: Não acessar contexto WebGL diretamente
      // Isso estava causando erros repetitivos quando o canvas era removido/restaurado
      // O A-Frame gerencia o contexto WebGL corretamente
      // Não precisamos acessar gl.clearColor manualmente
      
      // Verificar e garantir que o vídeo da câmera existe e está visível
      const mindarVideo = document.querySelector('#arVideo') || 
                          Array.from(document.querySelectorAll('video')).find(v => 
                            v.id !== 'video1' && v.id !== 'video2' && v.id !== 'video3' && 
                            (v.srcObject || v.videoWidth > 0)
                          )
      
      if (mindarVideo) {
        const computedStyle = window.getComputedStyle(mindarVideo)
        const isVisible = 
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden' &&
          computedStyle.opacity !== '0' &&
          mindarVideo.videoWidth > 0 &&
          mindarVideo.videoHeight > 0
        
        // Log apenas se houver problema (para não poluir console)
        if (!isVisible && !mindarVideo._visibilityLogged) {
          console.warn('⚠️ Vídeo da câmera existe mas não está visível ou não tem stream:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            videoWidth: mindarVideo.videoWidth,
            videoHeight: mindarVideo.videoHeight,
            hasSrcObject: !!mindarVideo.srcObject,
            paused: mindarVideo.paused,
            readyState: mindarVideo.readyState
          })
          mindarVideo._visibilityLogged = true
        }
        
        // Garantir posicionamento correto sempre - usar absolute no Android
        const isAndroid = /Android/i.test(navigator.userAgent)
        // CRÍTICO ANDROID: z-index do vídeo deve ser maior que o a-scene quando não há targets
        // Quando não há targets: vídeo (z-index: 0) > a-scene (z-index: -1)
        // Quando há targets: vídeo (z-index: 0) < a-scene (z-index: 1)
        const videoZIndex = activeTargetIndex === null ? '0' : '0' // Sempre 0, a-scene ajusta seu z-index
        mindarVideo.style.setProperty('z-index', videoZIndex, 'important')
        mindarVideo.style.setProperty('position', isAndroid ? 'absolute' : 'absolute', 'important')
        mindarVideo.style.setProperty('top', '0', 'important')
        mindarVideo.style.setProperty('left', '0', 'important')
        mindarVideo.style.setProperty('width', '100vw', 'important')
        mindarVideo.style.setProperty('height', '100vh', 'important')
        mindarVideo.style.setProperty('object-fit', 'cover', 'important')
        mindarVideo.style.setProperty('display', 'block', 'important')
        mindarVideo.style.setProperty('visibility', 'visible', 'important')
        mindarVideo.style.setProperty('opacity', '1', 'important')
        mindarVideo.style.setProperty('background-color', 'transparent', 'important')
        mindarVideo.style.setProperty('background', 'transparent', 'important')
        
        // Garantir que está reproduzindo
        if (mindarVideo.paused && mindarVideo.readyState >= 2 && mindarVideo.srcObject) {
          mindarVideo.play().catch(e => {
            console.warn('⚠️ Erro ao reproduzir vídeo da câmera:', e)
          })
        }
      } else {
        // Log apenas ocasionalmente para não poluir o console
        if (!window._videoNotFoundCount) window._videoNotFoundCount = 0
        window._videoNotFoundCount++
        if (window._videoNotFoundCount <= 3) {
          console.warn('⚠️ Vídeo #arVideo não encontrado - MindAR pode não ter criado ainda (tentativa', window._videoNotFoundCount, ')')
        }
      }
      
      // CRÍTICO ANDROID: Verificar e remover qualquer elemento com background preto que possa estar cobrindo
      // Verificar todos os elementos filhos do a-scene
      const allSceneChildren = scene.querySelectorAll('*')
      allSceneChildren.forEach((child) => {
        if (child === canvas || child === mindarVideo) return // Pular canvas e vídeo
        
        const childStyle = window.getComputedStyle(child)
        const bgColor = childStyle.backgroundColor
        
        // Se o elemento tem background preto e não é necessário, torná-lo transparente
        if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor === '#000000' || bgColor === 'black')) {
          // Apenas se não for um elemento de vídeo AR necessário
          if (!child.id || (!child.id.includes('target') && !child.id.includes('video'))) {
            child.style.setProperty('background-color', 'transparent', 'important')
            child.style.setProperty('background', 'transparent', 'important')
          }
        }
      })
    }

    // Chamar imediatamente
    forceAndroidTransparency()
    
    // Chamar continuamente a cada 100ms no Android
    const interval = setInterval(forceAndroidTransparency, 100)
    
    return () => clearInterval(interval)
  }, [cameraPermissionGranted])

  // REMOVIDO: Fallback de segurança - A-Frame gerencia transparência via atributos

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
        // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
        // REMOVIDO: Manipulação direta do canvas - A-Frame controla isso
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

    // REMOVIDO: getWebGLContext - NUNCA acessar contexto WebGL manualmente
    // Isso causa erro "Canvas has an existing context of a different type"
    // O A-Frame gerencia o contexto WebGL - não devemos tocá-lo

    // REMOVIDO: makeRendererTransparent - A-Frame gerencia transparência via atributos
  }, [])

  return (
    <div className="scan-page">
      {/* A-Frame Scene - SEMPRE renderizado (nunca desmontado) */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 0; autoStart: true; showStats: false; uiScanning: none; uiLoading: none; uiError: none;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer="alpha: true; antialias: true; preserveDrawingBuffer: false; colorManagement: false"
        embedded
        background="color: transparent"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          opacity: 1,
          display: 'block',
          transform: 'none',
          WebkitTransform: 'none'
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
            position: 'absolute', 
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
