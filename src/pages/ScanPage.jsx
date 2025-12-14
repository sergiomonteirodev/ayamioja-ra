import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
// import InterpreterVideo from '../components/InterpreterVideo' // DESATIVADO - vídeo de libras desativado
import SafeImage from '../components/SafeImage'
import AudioDescriptionAR from '../components/AudioDescriptionAR'

// Suprimir erros do Three.js sobre contexto WebGL (não afetam funcionalidade)
// Esses erros aparecem porque o Three.js tenta criar um contexto, mas já existe um do A-Frame
// Aplicar supressão GLOBALMENTE antes de qualquer código que possa gerar erros
// VERSÃO ULTRA AGRESSIVA: Interceptar no nível mais baixo possível
if (!window._webglErrorSuppressed) {
  const originalError = console.error.bind(console)
  const originalWarn = console.warn.bind(console)
  
  // CRÍTICO: Interceptar HTMLCanvasElement.prototype.getContext para evitar criação de novos contextos
  // Isso previne o erro na raiz, antes que o Three.js tente criar um novo contexto
  // APLICAR ANTES DE QUALQUER OUTRO CÓDIGO SER EXECUTADO
  if (!HTMLCanvasElement.prototype._originalGetContext) {
    HTMLCanvasElement.prototype._originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
      // Se já existe um contexto WebGL neste canvas, retornar o existente em vez de criar novo
      if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
        // PRIMEIRO: Verificar se já existe um contexto armazenado
        if (this._glContext && !this._glContext.isContextLost()) {
          return this._glContext
        }
        
        // SEGUNDO: Tentar obter contexto existente via método nativo (sem criar novo)
        try {
          // Primeiro, tentar obter do renderer do A-Frame se disponível
          const scene = document.querySelector('a-scene')
          if (scene) {
            const rendererSystem = scene.systems?.renderer
            if (rendererSystem) {
              const renderer = rendererSystem.renderer || rendererSystem
              if (renderer && typeof renderer.getContext === 'function') {
                const existingGl = renderer.getContext()
                if (existingGl && !existingGl.isContextLost()) {
                  // Armazenar para uso futuro
                  this._glContext = existingGl
                  return existingGl
                }
              }
            }
          }
        } catch (e) {
          // Ignorar erro
        }
        
        // TERCEIRO: Tentar obter contexto existente via método nativo do canvas
        // Alguns navegadores permitem obter o contexto existente sem criar novo
        try {
          // Tentar obter sem criar (alguns navegadores suportam isso)
          // Mas não podemos fazer isso diretamente, então vamos tentar criar e capturar o erro
        } catch (e) {
          // Ignorar
        }
        
        // QUARTO: Tentar criar novo contexto APENAS se realmente não existir um
        // Mas primeiro verificar se já existe um contexto no canvas (via propriedade interna)
        try {
          // Verificar se o canvas já tem um contexto (alguns navegadores expõem isso)
          if (this._context) {
            return this._context
          }
        } catch (e) {
          // Ignorar
        }
        
        // ÚLTIMO RECURSO: Tentar criar novo contexto
        // Se falhar, significa que já existe um - nesse caso, tentar obter o existente
        try {
          const context = this._originalGetContext.call(this, contextType, ...args)
          if (context) {
            // Armazenar para uso futuro
            this._glContext = context
            this._context = context // Também armazenar em _context
          }
          return context
        } catch (e) {
          // Se falhar ao criar (porque já existe), tentar obter o existente
          // Alguns navegadores armazenam o contexto internamente
          if (this._glContext && !this._glContext.isContextLost()) {
            return this._glContext
          }
          if (this._context && !this._context.isContextLost()) {
            return this._context
          }
          // Se tudo falhar, retornar null em vez de lançar erro
          // Isso evita que o Three.js mostre o erro no console
          return null
        }
      }
      
      // Para outros tipos de contexto, usar comportamento padrão
      return this._originalGetContext.call(this, contextType, ...args)
    }
  }
  
  // Função helper para verificar se deve suprimir
  const shouldSuppress = (...args) => {
    const fullMessage = args.map(arg => {
      if (typeof arg === 'string') return arg
      if (arg && typeof arg === 'object') {
        if (arg.message) return arg.message
        if (arg.toString) return arg.toString()
        try {
          return JSON.stringify(arg)
        } catch (e) {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
    
    // Verificar múltiplas variações da mensagem de erro - VERSÃO ULTRA AGRESSIVA
    const lowerMessage = fullMessage.toLowerCase()
    return lowerMessage.includes('webgl context could not be created') || 
           lowerMessage.includes('existing context of a different type') ||
           lowerMessage.includes('canvas has an existing context') ||
           (lowerMessage.includes('three.webglrenderer') && lowerMessage.includes('existing context')) ||
           (lowerMessage.includes('webgl') && lowerMessage.includes('existing context')) ||
           (lowerMessage.includes('three.webglrenderer') && lowerMessage.includes('canvas has an existing')) ||
           (lowerMessage.includes('webgl') && lowerMessage.includes('could not be created')) ||
           // Também verificar por padrões mais genéricos
           (lowerMessage.includes('webgl') && lowerMessage.includes('context') && lowerMessage.includes('different'))
  }
  
  // Interceptar console.error
  console.error = function(...args) {
    if (shouldSuppress(...args)) {
      // Não mostrar no console - é um erro esperado e não afeta funcionalidade
      return
    }
    // Mostrar outros erros normalmente
    originalError.apply(console, args)
  }
  
  // Interceptar console.warn também (alguns navegadores usam warn para esses erros)
  console.warn = function(...args) {
    if (shouldSuppress(...args)) {
      return
    }
    originalWarn.apply(console, args)
  }
  
  // Interceptar também window.onerror para capturar erros não tratados
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    if (shouldSuppress(message || '', error?.message || '', error?.stack || '')) {
      return true // Suprimir o erro
    }
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error)
    }
    return false
  }
  
  // Interceptar unhandledrejection também
  const originalUnhandledRejection = window.onunhandledrejection
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason
    if (shouldSuppress(String(reason), reason?.message || '', reason?.stack || '')) {
      event.preventDefault() // Suprimir o erro
    }
  })
  
  // Interceptar Error.prototype.toString para capturar erros lançados diretamente
  if (!Error.prototype._originalToString) {
    Error.prototype._originalToString = Error.prototype.toString
    Error.prototype.toString = function() {
      const message = this._originalToString.call(this)
      if (shouldSuppress(message, this.message || '', this.stack || '')) {
        // Retornar mensagem vazia para erros suprimidos
        return ''
      }
      return message
    }
  }
  
  window._webglErrorSuppressed = true
  window._originalConsoleError = originalError
  window._originalConsoleWarn = originalWarn
  window._originalOnError = originalOnError
}

const ScanPage = () => {
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
      
      // Garantir que o canvas seja transparente
      if (sceneRef.current) {
        const scene = sceneRef.current
        const canvas = scene.querySelector('canvas')
        if (canvas) {
          // Forçar transparência via WebGL - usar contexto existente do renderer
          try {
            const rendererSystem = scene.systems?.renderer
            if (rendererSystem) {
              const renderer = rendererSystem.renderer || rendererSystem
              if (renderer && typeof renderer.getContext === 'function') {
                const gl = renderer.getContext()
                if (gl && !gl.isContextLost()) {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: transparente
                  gl.enable(gl.BLEND)
                  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                  console.log('✅ Canvas WebGL configurado para transparência após permissão')
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Não foi possível acessar contexto WebGL:', e.message)
          }
          
          // Forçar transparência via CSS
          canvas.style.setProperty('background-color', 'transparent', 'important')
          canvas.style.setProperty('background', 'transparent', 'important')
          canvas.style.setProperty('opacity', '1', 'important')
          console.log('✅ Canvas CSS configurado para transparência após permissão')
        }
      }
      
      console.log('✅ Permissão concedida. MindAR iniciado, aguardando vídeo aparecer...')
      
      // Aplicar correções Android após permissão
      setTimeout(() => {
        const scene = sceneRef.current
        if (scene) {
          const forceAndroidTransparency = () => {
            const isAndroid = /Android/i.test(navigator.userAgent)
            if (!isAndroid) return
            
            const canvas = scene.querySelector('canvas')
            if (!canvas) return
            
            console.log('🔧 Aplicando correções Android após permissão...')
            // Usar contexto existente do renderer, não criar novo
            try {
              const rendererSystem = scene.systems?.renderer
              if (rendererSystem) {
                const renderer = rendererSystem.renderer || rendererSystem
                if (renderer && typeof renderer.getContext === 'function') {
                  const gl = renderer.getContext()
                  if (gl && !gl.isContextLost()) {
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    canvas.style.setProperty('background-color', 'transparent', 'important')
                    canvas.style.setProperty('background', 'transparent', 'important')
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Não foi possível acessar contexto WebGL:', e.message)
            }
          }
          forceAndroidTransparency()
        }
      }, 500)
      
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

  // SOLUÇÃO RADICAL ANDROID: Ocultar canvas completamente quando não há targets ativos
  // Isso evita o retângulo preto no meio cobrindo o vídeo
  // VERSÃO ULTRA AGRESSIVA: Verificar e forçar continuamente
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid || !cameraPermissionGranted) return

    const forceCanvasVisibility = () => {
      const scene = sceneRef.current
      if (!scene) return

      const canvas = scene.querySelector('canvas')
      if (!canvas) return

      // Verificar estilo computado para garantir que está realmente oculto
      const computedStyle = window.getComputedStyle(canvas)
      const isCurrentlyVisible = computedStyle.display !== 'none' && 
                                  computedStyle.visibility !== 'hidden' &&
                                  parseFloat(computedStyle.opacity) > 0

      if (activeTargetIndex === null) {
        // Nenhum target ativo: PARAR renderer completamente e ocultar canvas
        if (isCurrentlyVisible) {
          console.log('🔴 Parando renderer e ocultando canvas no Android (sem targets)')
          
          // PARAR renderer do A-Frame completamente
          try {
            const rendererSystem = scene.systems?.renderer
            if (rendererSystem) {
              const renderer = rendererSystem.renderer || rendererSystem
              if (renderer && typeof renderer.setAnimationLoop === 'function') {
                // Parar o loop de animação
                renderer.setAnimationLoop(null)
                console.log('✅ Renderer animation loop parado')
              }
              if (renderer && renderer.render) {
                // Interceptar render para não renderizar nada
                if (!renderer._androidRenderStopped) {
                  renderer._originalRenderForStop = renderer.render.bind(renderer)
                  renderer.render = function() {
                    // Não renderizar nada quando não há targets
                    return
                  }
                  renderer._androidRenderStopped = true
                  console.log('✅ Renderer.render interceptado para não renderizar')
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Erro ao parar renderer:', e)
          }
          
          // Múltiplas formas de ocultar para garantir
          canvas.style.setProperty('display', 'none', 'important')
          canvas.style.setProperty('visibility', 'hidden', 'important')
          canvas.style.setProperty('opacity', '0', 'important')
          canvas.style.setProperty('pointer-events', 'none', 'important')
          canvas.style.setProperty('position', 'absolute', 'important')
          canvas.style.setProperty('left', '-9999px', 'important')
          canvas.style.setProperty('top', '-9999px', 'important')
          canvas.style.setProperty('width', '0', 'important')
          canvas.style.setProperty('height', '0', 'important')
          
          // Também ocultar o a-scene
          scene.style.setProperty('display', 'none', 'important')
          scene.style.setProperty('visibility', 'hidden', 'important')
          scene.style.setProperty('opacity', '0', 'important')
        }
        
        // CRÍTICO: Mesmo oculto, garantir que o loop RAF continue limpando
        // Isso evita que o canvas apareça com fundo preto se for mostrado
        try {
          const gl = getWebGLContext(canvas)
          if (gl && !gl.isContextLost() && !canvas._androidContinuousClearRAF) {
            let rafId = null
            const continuousClear = () => {
              try {
                if (gl && !gl.isContextLost()) {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                }
                rafId = requestAnimationFrame(continuousClear)
                canvas._androidContinuousClearRAF = rafId
              } catch (e) {
                if (rafId) cancelAnimationFrame(rafId)
                canvas._androidContinuousClearRAF = null
              }
            }
            rafId = requestAnimationFrame(continuousClear)
            canvas._androidContinuousClearRAF = rafId
            console.log('✅ Loop RAF ativado mesmo sem targets para evitar fundo preto')
          }
        } catch (e) {
          // Ignorar
        }
      } else {
        // Target ativo: REINICIAR renderer e mostrar canvas transparente
        console.log('🟢 Target ativo - REINICIANDO renderer e mostrando canvas transparente no Android')
        
        // REINICIAR renderer do A-Frame
        try {
          const rendererSystem = scene.systems?.renderer
          if (rendererSystem) {
            const renderer = rendererSystem.renderer || rendererSystem
            if (renderer && renderer._androidRenderStopped && renderer._originalRenderForStop) {
              // Restaurar render original
              renderer.render = renderer._originalRenderForStop
              renderer._androidRenderStopped = false
              console.log('✅ Renderer.render restaurado')
            }
            if (renderer && typeof renderer.setAnimationLoop === 'function') {
              // Reiniciar loop de animação se necessário
              // O A-Frame gerencia isso automaticamente, mas garantimos que está ativo
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao reiniciar renderer:', e)
        }
        
        // Mostrar canvas mas garantir que esteja completamente transparente
        // SEMPRE forçar transparência, mesmo se já estiver visível
        canvas.style.setProperty('display', 'block', 'important')
        canvas.style.setProperty('visibility', 'visible', 'important')
        canvas.style.setProperty('opacity', '1', 'important')
        canvas.style.setProperty('background-color', 'transparent', 'important')
        canvas.style.setProperty('background', 'transparent', 'important')
        canvas.style.setProperty('position', 'fixed', 'important')
        canvas.style.setProperty('width', '100vw', 'important')
        canvas.style.setProperty('height', '100vh', 'important')
        canvas.style.setProperty('top', '0', 'important')
        canvas.style.setProperty('left', '0', 'important')
        canvas.style.setProperty('z-index', '1', 'important')
        canvas.style.setProperty('pointer-events', 'none', 'important')
        
        // Verificar dimensões reais do canvas
        const rect = canvas.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Se o canvas não está cobrindo toda a tela, forçar dimensões
        if (Math.abs(rect.width - viewportWidth) > 10 || Math.abs(rect.height - viewportHeight) > 10) {
          console.warn('⚠️ Canvas não está cobrindo toda a tela, forçando dimensões:', {
            canvasWidth: rect.width,
            canvasHeight: rect.height,
            viewportWidth,
            viewportHeight
          })
          // Forçar dimensões via atributos também
          canvas.setAttribute('width', viewportWidth)
          canvas.setAttribute('height', viewportHeight)
        }
        
        // Mostrar a-scene
        scene.style.setProperty('display', 'block', 'important')
        scene.style.setProperty('visibility', 'visible', 'important')
        scene.style.setProperty('opacity', '1', 'important')
        
        // Forçar transparência via WebGL - SEMPRE, mesmo se já foi feito
        try {
          const gl = getWebGLContext(canvas)
          if (gl && !gl.isContextLost()) {
            // Configurar viewport para cobrir toda a tela
            gl.viewport(0, 0, viewportWidth, viewportHeight)
            // Forçar transparência
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            
            // Interceptar clear se ainda não foi interceptado
            if (!gl._androidClearIntercepted) {
              const originalClear = gl.clear.bind(gl)
              gl.clear = function(mask) {
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                originalClear(mask)
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                // Limpar novamente para garantir transparência em TODA a área
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              }
              gl._androidClearIntercepted = true
              console.log('✅ gl.clear interceptado no forceCanvasVisibility')
            }
            
            // CRÍTICO: Loop contínuo via requestAnimationFrame para garantir clearColor sempre em alpha 0
            // NÃO limpar o canvas completo (isso apagaria o AR), apenas garantir que clearColor está correto
            if (!canvas._androidContinuousClearRAF) {
              let rafId = null
              const continuousClear = () => {
                try {
                  if (gl && !gl.isContextLost()) {
                    // Apenas garantir que clearColor está sempre em alpha 0
                    // NÃO limpar o canvas (isso apagaria o conteúdo AR)
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  }
                  rafId = requestAnimationFrame(continuousClear)
                  canvas._androidContinuousClearRAF = rafId
                } catch (e) {
                  if (rafId) cancelAnimationFrame(rafId)
                  canvas._androidContinuousClearRAF = null
                }
              }
              rafId = requestAnimationFrame(continuousClear)
              canvas._androidContinuousClearRAF = rafId
              console.log('✅ Loop contínuo RAF ativado - garantindo clearColor sempre em alpha 0 (sem limpar AR)')
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao configurar WebGL:', e)
        }
      }
    }

    // Executar imediatamente
    forceCanvasVisibility()
    
    // Executar continuamente a cada 100ms para garantir que o canvas permaneça oculto
    const interval = setInterval(forceCanvasVisibility, 100)

    return () => {
      clearInterval(interval)
      // Limpar RAF se existir
      const canvas = sceneRef.current?.querySelector('canvas')
      if (canvas && canvas._androidContinuousClearRAF) {
        cancelAnimationFrame(canvas._androidContinuousClearRAF)
        canvas._androidContinuousClearRAF = null
      }
    }
  }, [activeTargetIndex, cameraPermissionGranted])

  // CRÍTICO: Interceptar criação do canvas ANTES do A-Frame renderizar (Android)
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) return

    console.log('🔍 Configurando MutationObserver para interceptar criação do canvas no Android...')

    // Observar quando o canvas é criado
    const observer = new MutationObserver((mutations) => {
      const canvas = document.querySelector('a-scene canvas')
      if (canvas && !canvas._androidFixed) {
        canvas._androidFixed = true
        console.log('✅ Canvas detectado - aplicando transparência IMEDIATAMENTE')
        
        // Forçar transparência IMEDIATAMENTE via CSS
        canvas.style.setProperty('background-color', 'transparent', 'important')
        canvas.style.setProperty('background', 'transparent', 'important')
        canvas.style.setProperty('opacity', '1', 'important')
        canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
        canvas.style.setProperty('pointer-events', 'none', 'important')
        
        // Forçar transparência via WebGL ANTES de qualquer renderização
        try {
          // NÃO criar novo contexto - usar contexto existente do renderer
          let gl = null
          try {
            const rendererSystem = scene.systems?.renderer
            if (rendererSystem) {
              const renderer = rendererSystem.renderer || rendererSystem
              if (renderer && typeof renderer.getContext === 'function') {
                gl = renderer.getContext()
              }
            }
          } catch (e) {
            console.warn('⚠️ Não foi possível obter contexto do renderer:', e.message)
          }
          
          // NÃO tentar criar novo contexto - se não conseguir do renderer, não fazer nada
          // Criar novo contexto causa erro "Canvas has an existing context of a different type"
          if (!gl || (gl && gl.isContextLost())) {
            console.warn('⚠️ Não foi possível obter contexto WebGL do renderer - canvas já tem contexto criado pelo A-Frame')
          }
          
          if (gl && !gl.isContextLost()) {
            // Configurar ANTES de qualquer renderização
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            
            // Interceptar clear ANTES de qualquer uso - VERSÃO ULTRA AGRESSIVA
            // CRÍTICO: Garantir que TODA a área do canvas seja limpa com alpha 0
            if (!gl._androidClearIntercepted) {
              const originalClear = gl.clear.bind(gl)
              gl.clear = function(mask) {
                // SEMPRE garantir alpha 0 antes de limpar
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                originalClear(mask)
                // E novamente após limpar
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                // CRÍTICO: Limpar TODA a área do canvas com alpha 0 (não apenas parcialmente)
                // Isso garante que não haja retângulo preto no meio
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              }
              gl._androidClearIntercepted = true
              
              // Limpar canvas IMEDIATAMENTE após interceptar - TODA a área
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              
              // Loop contínuo via requestAnimationFrame para garantir transparência em TODA a área
              let rafId = null
              const forceTransparency = () => {
                try {
                  if (gl && !gl.isContextLost()) {
                    // Garantir clearColor sempre em 0,0,0,0
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    // Limpar TODA a área do canvas periodicamente para evitar retângulo preto
                    // Isso força transparência completa em toda a tela
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  }
                  rafId = requestAnimationFrame(forceTransparency)
                } catch (e) {
                  if (rafId) cancelAnimationFrame(rafId)
                }
              }
              rafId = requestAnimationFrame(forceTransparency)
              canvas._androidTransparencyRAF = rafId
              
              console.log('✅ gl.clear interceptado + loop RAF para limpar TODA a área do canvas com alpha 0')
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao configurar WebGL no canvas recém-criado:', e)
        }
      }
    })

    // Observar mudanças no DOM
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    })

    // Também verificar se o canvas já existe e aplicar correções completas
    const checkExistingCanvas = () => {
      const existingCanvas = document.querySelector('a-scene canvas')
      if (existingCanvas && !existingCanvas._androidFixed) {
        existingCanvas._androidFixed = true
        console.log('✅ Canvas existente detectado - aplicando correções imediatas')
        
        // Forçar CSS transparente
        existingCanvas.style.setProperty('background-color', 'transparent', 'important')
        existingCanvas.style.setProperty('background', 'transparent', 'important')
        existingCanvas.style.setProperty('opacity', '1', 'important')
        existingCanvas.style.setProperty('width', '100vw', 'important')
        existingCanvas.style.setProperty('height', '100vh', 'important')
        existingCanvas.style.setProperty('position', 'fixed', 'important')
        existingCanvas.style.setProperty('top', '0', 'important')
        existingCanvas.style.setProperty('left', '0', 'important')
        
        // Forçar WebGL transparente e LIMPAR TODO O CANVAS
        // NÃO criar novo contexto - usar contexto existente do renderer
        let gl = null
        try {
          const rendererSystem = scene.systems?.renderer
          if (rendererSystem) {
            const renderer = rendererSystem.renderer || rendererSystem
            if (renderer && typeof renderer.getContext === 'function') {
              gl = renderer.getContext()
            }
          }
        } catch (e) {
          // Ignorar erro
        }
        if (gl && !gl.isContextLost()) {
          gl.clearColor(0.0, 0.0, 0.0, 0.0)
          // LIMPAR TODO O CANVAS imediatamente
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
          gl.clearColor(0.0, 0.0, 0.0, 0.0)
          
          // Interceptar clear se ainda não foi interceptado
          if (!gl._androidClearIntercepted) {
            const originalClear = gl.clear.bind(gl)
            gl.clear = function(mask) {
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              originalClear(mask)
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              gl.clear(gl.COLOR_BUFFER_BIT)
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
            }
            gl._androidClearIntercepted = true
          }
        }
      }
    }

    // Verificar imediatamente e depois periodicamente
    checkExistingCanvas()
    const checkInterval = setInterval(checkExistingCanvas, 500)

    return () => {
      observer.disconnect()
      clearInterval(checkInterval)
      // Limpar RAF se existir
      const canvas = document.querySelector('a-scene canvas')
      if (canvas && canvas._androidTransparencyRAF) {
        cancelAnimationFrame(canvas._androidTransparencyRAF)
      }
    }
  }, [])

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
      
      // Forçar canvas totalmente transparente
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
      canvas.style.setProperty('z-index', '1', 'important')
      
      // Forçar via WebGL - LIMPAR CANVAS COMPLETO COM ALPHA 0
      // NÃO criar novo contexto - usar contexto existente do renderer
      try {
        let gl = null
        try {
          const rendererSystem = scene.systems?.renderer
          if (rendererSystem) {
            const renderer = rendererSystem.renderer || rendererSystem
            if (renderer && typeof renderer.getContext === 'function') {
              gl = renderer.getContext()
            }
          }
        } catch (e) {
          console.warn('⚠️ Não foi possível obter contexto do renderer:', e.message)
        }
        
        if (gl && !gl.isContextLost()) {
          // Configurar para transparência
          gl.clearColor(0.0, 0.0, 0.0, 0.0)
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
          
          // LIMPAR TODO O CANVAS com alpha 0 imediatamente
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
          gl.clearColor(0.0, 0.0, 0.0, 0.0)
          
          // Interceptar clear se ainda não foi interceptado
          if (!gl._androidClearIntercepted) {
            const originalClear = gl.clear.bind(gl)
            gl.clear = function(mask) {
              // SEMPRE garantir alpha 0 antes de limpar
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              originalClear(mask)
              // E novamente após limpar
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              // CRÍTICO: Limpar TODA a área do canvas com alpha 0 (não apenas parcialmente)
              // Isso garante que não haja retângulo preto no meio cobrindo o vídeo
              gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
            }
            gl._androidClearIntercepted = true
            console.log('✅ gl.clear interceptado no forceAndroidTransparency')
          }
        }
      } catch (e) {
        console.warn('⚠️ Erro ao configurar WebGL:', e)
      }
      
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
        
        // Garantir posicionamento correto sempre
        mindarVideo.style.setProperty('z-index', '-2', 'important')
        mindarVideo.style.setProperty('position', 'fixed', 'important')
        mindarVideo.style.setProperty('top', '0', 'important')
        mindarVideo.style.setProperty('left', '0', 'important')
        mindarVideo.style.setProperty('width', '100vw', 'important')
        mindarVideo.style.setProperty('height', '100vh', 'important')
        mindarVideo.style.setProperty('object-fit', 'cover', 'important')
        mindarVideo.style.setProperty('display', 'block', 'important')
        mindarVideo.style.setProperty('visibility', 'visible', 'important')
        mindarVideo.style.setProperty('opacity', '1', 'important')
        
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
    }

    // Chamar imediatamente
    forceAndroidTransparency()
    
    // Chamar continuamente a cada 100ms no Android
    const interval = setInterval(forceAndroidTransparency, 100)
    
    return () => clearInterval(interval)
  }, [cameraPermissionGranted])

  // Fallback de segurança: se canvas não estiver transparente após 2s, aplicar correção agressiva
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid || !cameraPermissionGranted) return

    const timeout = setTimeout(() => {
      const canvas = document.querySelector('a-scene canvas')
      if (canvas) {
        const style = window.getComputedStyle(canvas)
        const bgColor = style.backgroundColor
        
        // Verificar se canvas está realmente transparente
        const isTransparent = bgColor === 'rgba(0, 0, 0, 0)' || 
                             bgColor === 'transparent' ||
                             bgColor.includes('rgba(0, 0, 0, 0)')
        
        if (!isTransparent) {
          console.error('❌ Canvas ainda não transparente após 2s - aplicando correção agressiva:', {
            backgroundColor: bgColor,
            opacity: style.opacity,
            display: style.display
          })
          
          // Correção agressiva: ocultar temporariamente
          canvas.style.setProperty('opacity', '0', 'important')
          
          // Forçar transparência via WebGL
          try {
            const gl = getWebGLContext(canvas)
            if (gl && !gl.isContextLost()) {
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            }
          } catch (e) {
            console.warn('⚠️ Erro ao limpar canvas:', e)
          }
          
          // Tentar novamente após 500ms
          setTimeout(() => {
            canvas.style.setProperty('background-color', 'transparent', 'important')
            canvas.style.setProperty('background', 'transparent', 'important')
            canvas.style.setProperty('opacity', '1', 'important')
            
            // Forçar novamente via WebGL
            try {
              const gl = getWebGLContext(canvas)
              if (gl && !gl.isContextLost()) {
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              }
            } catch (e) {
              // Ignorar
            }
            
            console.log('✅ Correção agressiva aplicada - canvas deve estar transparente agora')
          }, 500)
        } else {
          console.log('✅ Canvas está transparente após 2s')
        }
      }
    }, 2000)

    return () => clearTimeout(timeout)
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

    // Função helper para obter o contexto WebGL existente (sem criar novo)
    // CRÍTICO: Não usar canvas.getContext() diretamente - isso tenta criar um novo contexto
    // e causa erro "Canvas has an existing context of a different type"
    const getWebGLContext = (canvas) => {
      if (!canvas) return null
      
      // Primeiro, tentar obter do renderer do A-Frame (contexto existente)
      try {
        const rendererSystem = scene.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer && typeof renderer.getContext === 'function') {
            const gl = renderer.getContext()
            if (gl && !gl.isContextLost()) {
              return gl
            }
          }
        }
      } catch (e) {
        // Ignorar erro
      }
      
      // Se não conseguir do renderer, verificar se o canvas já tem um contexto armazenado
      try {
        if (canvas._glContext && !canvas._glContext.isContextLost()) {
          return canvas._glContext
        }
      } catch (e) {
        // Ignorar erro
      }
      
      // NÃO tentar criar novo contexto - isso causa erro
      // Se não conseguir do renderer, retornar null
      return null
    }

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
            // Usar getContext() do renderer, não criar novo contexto
            if (renderer.domElement) {
              const gl = renderer.getContext()
              if (gl) {
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                gl.clearColor(0.0, 0.0, 0.0, 0.0) // Forçar transparente
                
                // CRÍTICO: Interceptar o método render e clear do WebGL para sempre limpar com alpha 0
                // VERSÃO ULTRA AGRESSIVA: Interceptar clear() diretamente
                if (!renderer._originalRender) {
                  const gl = renderer.getContext()
                  if (gl && !gl._clearIntercepted) {
                    // Interceptar o método clear() do WebGL para sempre usar alpha 0
                    gl._originalClear = gl.clear.bind(gl)
                    gl.clear = function(mask) {
                      // Sempre garantir clearColor transparente antes de limpar
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                      gl._originalClear(mask)
                    }
                    gl._clearIntercepted = true
                    console.log('✅ WebGL clear() interceptado - sempre usando alpha 0')
                  }
                  
                  renderer._originalRender = renderer.render.bind(renderer)
                  renderer.render = function(scene, camera) {
                    const gl = this.getContext()
                    if (gl && !gl.isContextLost()) {
                      // ANTES de renderizar: garantir clearColor com alpha 0
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                      // Limpar TODO o canvas com alpha 0 antes de renderizar
                      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    }
                    // Chamar o render original
                    renderer._originalRender(scene, camera)
                    // DEPOIS de renderizar: garantir clearColor novamente
                    if (gl && !gl.isContextLost()) {
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    }
                  }
                  console.log('✅ Método render interceptado - limpando canvas ANTES e DEPOIS de renderizar')
                }
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
                    gl.clearColor(0.0, 0.0, 0.0, 0.0) // Forçar transparente
                    
                    // CRÍTICO: Interceptar o método render para sempre limpar com alpha 0
                    // VERSÃO ULTRA AGRESSIVA: Limpar ANTES e DEPOIS de renderizar
                    if (!renderer._originalRender) {
                      renderer._originalRender = renderer.render.bind(renderer)
                      renderer.render = function(scene, camera) {
                        const gl = this.getContext()
                        if (gl && !gl.isContextLost()) {
                          // ANTES de renderizar: garantir clearColor com alpha 0
                          gl.clearColor(0.0, 0.0, 0.0, 0.0)
                          // Limpar TODO o canvas com alpha 0 antes de renderizar
                          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                          gl.clearColor(0.0, 0.0, 0.0, 0.0)
                        }
                        // Chamar o render original
                        renderer._originalRender(scene, camera)
                        // DEPOIS de renderizar: garantir clearColor novamente
                        if (gl && !gl.isContextLost()) {
                          gl.clearColor(0.0, 0.0, 0.0, 0.0)
                        }
                      }
                      console.log('✅ Método render interceptado - limpando canvas ANTES e DEPOIS (via AFRAME.scenes)')
                    }
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
          const gl = getWebGLContext(canvas)
          if (gl) {
            // Detectar Android/Chrome para aplicar correções mais agressivas
            const isAndroid = /Android/i.test(navigator.userAgent)
            const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
            const needsAggressiveFix = isAndroid && isChrome
            
            // Forçar limpar o canvas com alpha transparente
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            
            // Interceptar gl.clear() de forma inteligente: apenas garantir clearColor 0 antes de limpar
            // Mas permitir que a limpeza aconteça normalmente (incluindo depth buffer para AR)
            if (!gl._originalClear) {
              gl._originalClear = gl.clear.bind(gl)
              gl.clear = function(mask) {
                // SEMPRE garantir clearColor com alpha 0 antes de limpar
                // Isso garante transparência sem interferir na detecção
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                // Permitir que a limpeza aconteça normalmente (incluindo depth buffer)
                gl._originalClear(mask)
                // No Android/Chrome, forçar clearColor novamente após limpar
                if (needsAggressiveFix) {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                }
              }
              console.log('✅ gl.clear interceptado para garantir transparência (permitindo limpeza normal)', needsAggressiveFix ? '[Android/Chrome: modo agressivo]' : '')
            }
            
            // No Android/Chrome, adicionar um intervalo que força clearColor a 0 continuamente
            if (needsAggressiveFix && !gl._androidClearColorInterval) {
              gl._androidClearColorInterval = setInterval(() => {
                try {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                } catch (e) {
                  // Ignorar erros se o contexto foi perdido
                }
              }, 100) // A cada 100ms
              console.log('✅ Intervalo de correção de clearColor ativado para Android/Chrome')
            }
            
            console.log('✅ Canvas WebGL configurado para transparência', needsAggressiveFix ? '[Android/Chrome]' : '')
          }
        } catch (e) {
          console.warn('⚠️ Erro ao configurar WebGL:', e)
        }
      }
      
      return rendererFound
    }

    // Função específica para corrigir transparência no Android
    const forceAndroidTransparency = () => {
      const isAndroid = /Android/i.test(navigator.userAgent)
      if (!isAndroid) return
      
      const scene = sceneRef.current
      if (!scene) return
      
      const canvas = scene.querySelector('canvas')
      if (!canvas) return
      
      console.log('🔧 Aplicando correções específicas para Android...')
      
      // Forçar transparência via CSS de forma mais agressiva
      canvas.style.setProperty('background-color', 'transparent', 'important')
      canvas.style.setProperty('background', 'transparent', 'important')
      canvas.style.setProperty('opacity', '1', 'important')
      canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
      canvas.style.setProperty('pointer-events', 'none', 'important')
      
      // Garantir que o canvas não cubra o vídeo - ajustar z-index
      canvas.style.setProperty('z-index', '1', 'important')
      
      // Garantir dimensões corretas
      canvas.style.setProperty('width', '100vw', 'important')
      canvas.style.setProperty('height', '100vh', 'important')
      canvas.style.setProperty('position', 'fixed', 'important')
      canvas.style.setProperty('top', '0', 'important')
      canvas.style.setProperty('left', '0', 'important')
      
      // Acessar WebGL diretamente
      // NÃO criar novo contexto - usar contexto existente do renderer
      let gl = null
      try {
        const rendererSystem = scene.systems?.renderer
        if (rendererSystem) {
          const renderer = rendererSystem.renderer || rendererSystem
          if (renderer && typeof renderer.getContext === 'function') {
            gl = renderer.getContext()
          }
        }
      } catch (e) {
        console.warn('⚠️ Não foi possível obter contexto do renderer:', e.message)
      }
      
      if (gl && !gl.isContextLost()) {
        // Configurar para transparência
        gl.clearColor(0.0, 0.0, 0.0, 0.0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        
        // Interceptar clear para sempre usar alpha 0
        if (!gl._androidClearIntercepted) {
          const originalClear = gl.clear.bind(gl)
          gl.clear = function(mask) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            originalClear(mask)
            // Forçar novamente após clear
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
          }
          gl._androidClearIntercepted = true
          console.log('✅ gl.clear interceptado para Android')
        }
        
        // Interceptar render do renderer se disponível
        try {
          const rendererSystem = scene.systems?.renderer
          if (rendererSystem) {
            const renderer = rendererSystem.renderer || rendererSystem
            if (renderer && typeof renderer.render === 'function' && !renderer._androidRenderIntercepted) {
              const originalRender = renderer.render.bind(renderer)
              renderer.render = function(scene, camera) {
                const gl = this.getContext()
                if (gl && !gl.isContextLost()) {
                  // ANTES de renderizar: garantir clearColor com alpha 0 e limpar canvas
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                }
                originalRender(scene, camera)
                // DEPOIS de renderizar: garantir clearColor novamente
                if (gl && !gl.isContextLost()) {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                }
              }
              renderer._androidRenderIntercepted = true
              console.log('✅ renderer.render interceptado para Android - limpando ANTES e DEPOIS')
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao interceptar renderer:', e)
        }
        
        // Intervalo agressivo para Android + requestAnimationFrame
        if (!canvas._androidTransparencyInterval) {
          // Usar setInterval para CSS
          canvas._androidTransparencyInterval = setInterval(() => {
            try {
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              canvas.style.setProperty('background-color', 'transparent', 'important')
              canvas.style.setProperty('background', 'transparent', 'important')
              canvas.style.setProperty('opacity', '1', 'important')
            } catch (e) {
              // Contexto pode ter sido perdido
            }
          }, 50) // A cada 50ms no Android
          
          // Usar requestAnimationFrame para WebGL (mais suave)
          let rafId = null
          const forceTransparencyRAF = () => {
            try {
              if (gl) {
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              }
              canvas.style.setProperty('background-color', 'transparent', 'important')
              canvas.style.setProperty('background', 'transparent', 'important')
              rafId = requestAnimationFrame(forceTransparencyRAF)
            } catch (e) {
              // Parar se contexto foi perdido
              if (rafId) {
                cancelAnimationFrame(rafId)
              }
            }
          }
          rafId = requestAnimationFrame(forceTransparencyRAF)
          canvas._androidRAFId = rafId
          
          console.log('✅ Intervalo agressivo de transparência ativado para Android (50ms + RAF)')
        }
      }
      
      // Também forçar no elemento a-scene
      scene.style.setProperty('background-color', 'transparent', 'important')
      scene.style.setProperty('background', 'transparent', 'important')
      scene.style.setProperty('opacity', '1', 'important')
      
      // Garantir que o vídeo da câmera esteja visível e atrás do canvas
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
        console.log('✅ Vídeo da câmera reposicionado para Android')
      }
      
      console.log('✅ Correções Android aplicadas')
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
      // Usar window.innerWidth/innerHeight diretamente para evitar problemas com padding/margin
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const currentWidth = parseInt(computedStyle.width) || 0
      const currentHeight = parseInt(computedStyle.height) || 0
      const widthDiff = Math.abs(currentWidth - viewportWidth)
      const heightDiff = Math.abs(currentHeight - viewportHeight)
      
      // Tolerância maior para altura (alguns navegadores têm barra de endereço que muda o viewport)
      const heightTolerance = 20 // 20px de tolerância para altura
      
      // Verificar se precisa ajustar
      const needsAdjustment = 
        computedStyle.position !== 'fixed' ||
        computedStyle.zIndex !== '-2' ||
        widthDiff > 10 || // Mais de 10px de diferença na largura
        heightDiff > heightTolerance || // Mais de 20px de diferença na altura
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
        mindarVideo.style.setProperty('min-width', '100vw', 'important')
        mindarVideo.style.setProperty('min-height', '100vh', 'important')
        mindarVideo.style.setProperty('max-width', '100vw', 'important')
        mindarVideo.style.setProperty('max-height', '100vh', 'important')
        mindarVideo.style.setProperty('object-fit', 'cover', 'important')
        mindarVideo.style.setProperty('z-index', '-2', 'important')
        mindarVideo.style.setProperty('margin', '0', 'important')
        mindarVideo.style.setProperty('padding', '0', 'important')
        mindarVideo.style.setProperty('border', 'none', 'important')
        mindarVideo.style.setProperty('outline', 'none', 'important')
        mindarVideo.style.setProperty('background-color', 'transparent', 'important')
        mindarVideo.style.setProperty('display', 'block', 'important')
        mindarVideo.style.setProperty('visibility', 'visible', 'important')
        mindarVideo.style.setProperty('opacity', '1', 'important')
        
        // Verificar se os estilos foram aplicados corretamente
        setTimeout(() => {
          const newComputedStyle = window.getComputedStyle(mindarVideo)
          const actualWidth = parseInt(newComputedStyle.width) || 0
          const actualHeight = parseInt(newComputedStyle.height) || 0
          const currentViewportWidth = window.innerWidth
          const currentViewportHeight = window.innerHeight
          
          // Tolerância maior para altura (alguns navegadores têm barra de endereço que muda o viewport)
          const heightTolerance = 20
          
          if (Math.abs(actualWidth - currentViewportWidth) > 10 || Math.abs(actualHeight - currentViewportHeight) > heightTolerance) {
            // Tentar corrigir novamente se ainda não estiver correto
            mindarVideo.style.setProperty('width', '100vw', 'important')
            mindarVideo.style.setProperty('height', '100vh', 'important')
            mindarVideo.style.setProperty('max-width', '100vw', 'important')
            mindarVideo.style.setProperty('max-height', '100vh', 'important')
            mindarVideo.style.setProperty('min-width', '100vw', 'important')
            mindarVideo.style.setProperty('min-height', '100vh', 'important')
            
            console.warn('⚠️ Vídeo não está cobrindo toda a tela:', {
              expectedWidth: currentViewportWidth,
              actualWidth,
              expectedHeight: currentViewportHeight,
              actualHeight,
              computedWidth: newComputedStyle.width,
              computedHeight: newComputedStyle.height,
              inlineWidth: mindarVideo.style.width,
              inlineHeight: mindarVideo.style.height,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight
            })
          } else {
            console.log('✅ Vídeo está cobrindo toda a tela corretamente')
          }
        }, 100)
      }
      
      // CRÍTICO: Garantir que o vídeo tenha stream e esteja reproduzindo
      const hasStream = !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0)
      
      // Função para tentar reproduzir o vídeo
      const tryPlayVideo = () => {
        if (mindarVideo && !mindarVideo.paused) return // Já está reproduzindo
        
        // Tentar reproduzir mesmo se não tiver stream ainda (pode receber depois)
        if (mindarVideo.readyState >= 1 || mindarVideo.srcObject) {
          console.log('▶️ Tentando reproduzir vídeo da câmera')
          mindarVideo.play().catch(e => {
            console.warn('⚠️ Erro ao reproduzir vídeo da câmera:', e)
          })
        }
      }
      
      // Adicionar listeners para quando o stream for atribuído
      if (!mindarVideo._streamListenersAdded) {
        mindarVideo._streamListenersAdded = true
        
        // Listener para quando srcObject for atribuído
        const checkSrcObject = () => {
          if (mindarVideo.srcObject) {
            console.log('✅ srcObject atribuído ao vídeo')
            tryPlayVideo()
          }
        }
        
        // Listener para quando o vídeo receber metadados (dimensões)
        mindarVideo.addEventListener('loadedmetadata', () => {
          console.log('✅ Vídeo recebeu metadados (dimensões):', {
            videoWidth: mindarVideo.videoWidth,
            videoHeight: mindarVideo.videoHeight,
            hasSrcObject: !!mindarVideo.srcObject
          })
          tryPlayVideo()
        })
        
        // Listener para quando o vídeo estiver pronto para reproduzir
        mindarVideo.addEventListener('canplay', () => {
          console.log('✅ Vídeo pode reproduzir')
          tryPlayVideo()
        })
        
        // Verificar srcObject periodicamente (fallback)
        const srcObjectCheck = setInterval(() => {
          if (mindarVideo.srcObject) {
            console.log('✅ srcObject detectado via polling')
            clearInterval(srcObjectCheck)
            tryPlayVideo()
          }
        }, 200)
        
        // Limpar após 10 segundos
        setTimeout(() => clearInterval(srcObjectCheck), 10000)
      }
      
      if (!hasStream) {
        console.warn('⚠️ Vídeo não tem stream - tentando aguardar MindAR atribuir stream...')
        
        // Tentar obter stream diretamente do MindAR tracker se disponível
        const tryGetStreamFromMindAR = () => {
          try {
            const scene = sceneRef.current
            if (!scene) return null
            
            const mindarSystem = scene.systems?.mindar || 
                                scene.systems?.['mindar-image-system'] ||
                                scene.systems?.['mindar-image']
            
            if (mindarSystem && mindarSystem.tracker) {
              const tracker = mindarSystem.tracker
              // Tentar acessar o vídeo do tracker
              if (tracker.video) {
                console.log('✅ Vídeo encontrado no tracker do MindAR')
                return tracker.video.srcObject || null
              }
              // Tentar acessar o stream diretamente
              if (tracker.stream) {
                console.log('✅ Stream encontrado no tracker do MindAR')
                return tracker.stream
              }
            }
          } catch (e) {
            console.warn('⚠️ Erro ao tentar obter stream do MindAR:', e)
          }
          return null
        }
        
        // Tentar obter stream do MindAR imediatamente
        const mindarStream = tryGetStreamFromMindAR()
        if (mindarStream) {
          console.log('✅ Atribuindo stream do MindAR ao vídeo manualmente')
          mindarVideo.srcObject = mindarStream
          tryPlayVideo()
        } else {
          // Log detalhado do estado do MindAR para debug
          try {
            const scene = sceneRef.current
            if (scene) {
              const mindarSystem = scene.systems?.mindar || 
                                  scene.systems?.['mindar-image-system'] ||
                                  scene.systems?.['mindar-image']
              if (mindarSystem) {
                console.log('🔍 Estado do MindAR:', {
                  hasTracker: !!mindarSystem.tracker,
                  isTracking: mindarSystem.isTracking,
                  isReady: mindarSystem.isReady,
                  trackerVideo: !!mindarSystem.tracker?.video,
                  trackerStream: !!mindarSystem.tracker?.stream,
                  trackerState: mindarSystem.tracker?.state
                })
              } else {
                console.warn('⚠️ Sistema MindAR não encontrado')
              }
            }
          } catch (e) {
            console.warn('⚠️ Erro ao verificar estado do MindAR:', e)
          }
          
          // Aguardar um pouco mais para o MindAR atribuir o stream
          let attempts = 0
          const checkStream = setInterval(() => {
            attempts++
            
            // Tentar obter stream do MindAR novamente a cada tentativa (mais frequente)
            const mindarStream = tryGetStreamFromMindAR()
            if (mindarStream && !mindarVideo.srcObject) {
              console.log('✅ Atribuindo stream do MindAR ao vídeo após', attempts * 100, 'ms')
              mindarVideo.srcObject = mindarStream
              clearInterval(checkStream)
              tryPlayVideo()
              return
            }
            
            const currentStream = !!(mindarVideo.srcObject || mindarVideo.videoWidth > 0)
            if (currentStream) {
              console.log('✅ Vídeo recebeu stream após', attempts * 100, 'ms')
              clearInterval(checkStream)
              tryPlayVideo()
            } else if (attempts >= 100) { // Aguardar até 10 segundos
              console.warn('⚠️ Vídeo ainda não tem stream após 10 segundos - tentando obter stream diretamente')
              clearInterval(checkStream)
              
              // Última tentativa: obter stream diretamente do MindAR
              const finalStream = tryGetStreamFromMindAR()
              if (finalStream) {
                console.log('✅ Atribuindo stream do MindAR ao vídeo (última tentativa)')
                mindarVideo.srcObject = finalStream
                tryPlayVideo()
              } else {
                // Tentar reproduzir mesmo sem stream (pode funcionar)
                console.warn('⚠️ Não foi possível obter stream do MindAR - tentando reproduzir vídeo mesmo assim')
                tryPlayVideo()
              }
            }
          }, 100)
        }
      } else {
        // Tem stream - tentar reproduzir imediatamente
        tryPlayVideo()
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
              // Canvas está transparente no CSS, mas pode estar sendo limpo com cor opaca pelo WebGL
              console.warn('⚠️ Canvas está transparente no CSS, mas pode estar sendo limpo com cor opaca pelo WebGL')
              console.log('🔧 Configurando WebGL clearColor para transparência (sem interceptar gl.clear para não interferir na detecção)...')
              
              // Interceptar gl.clear() de forma inteligente: apenas garantir clearColor 0 antes de limpar
              // Mas permitir que a limpeza aconteça normalmente (incluindo depth buffer para AR)
              const gl = getWebGLContext(canvas)
              if (gl) {
                // Detectar Android/Chrome para aplicar correções mais agressivas
                const isAndroid = /Android/i.test(navigator.userAgent)
                const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
                const needsAggressiveFix = isAndroid && isChrome
                
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                
                if (!gl._originalClear) {
                  gl._originalClear = gl.clear.bind(gl)
                  gl.clear = function(mask) {
                    // SEMPRE garantir clearColor com alpha 0 antes de limpar
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    // Permitir que a limpeza aconteça normalmente
                    gl._originalClear(mask)
                    // No Android/Chrome, forçar clearColor novamente após limpar
                    if (needsAggressiveFix) {
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    }
                  }
                  console.log('✅ gl.clear interceptado no diagnóstico (permitindo limpeza normal)', needsAggressiveFix ? '[Android/Chrome: modo agressivo]' : '')
                }
                
                // No Android/Chrome, adicionar um intervalo que força clearColor a 0 continuamente
                if (needsAggressiveFix && !gl._androidClearColorInterval) {
                  gl._androidClearColorInterval = setInterval(() => {
                    try {
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    } catch (e) {
                      // Ignorar erros se o contexto foi perdido
                    }
                  }, 100) // A cada 100ms
                  console.log('✅ Intervalo de correção de clearColor ativado no diagnóstico para Android/Chrome')
                }
              }
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
              const gl = getWebGLContext(canvas)
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
          const gl = getWebGLContext(canvas)
          if (gl) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            canvas.style.setProperty('background-color', 'transparent', 'important')
            canvas.style.setProperty('background', 'transparent', 'important')
          }
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
      
      // Interceptar requestAnimationFrame para garantir transparência a cada frame
      // VERSÃO ULTRA AGRESSIVA para Android/Chrome
      const isAndroid = /Android/i.test(navigator.userAgent)
      const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
      const needsAggressiveRAF = isAndroid && isChrome
      
      if (!window._rafIntercepted) {
        const originalRAF = window.requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
          return originalRAF(function(time) {
            // ANTES de cada frame, garantir transparência mas NÃO limpar se houver target ativo
            const canvas = scene.querySelector('canvas')
            // Usar ref para acessar valor atual de activeTargetIndex dentro do closure
            const hasActiveTarget = activeTargetIndexRef.current !== null
            
            if (canvas) {
              try {
                const gl = getWebGLContext(canvas)
                if (gl && !gl.isContextLost()) {
                  // Sempre garantir clearColor está em alpha 0
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  
                  // CRÍTICO: Só limpar canvas completamente se NÃO houver target ativo
                  // Se houver target, NÃO limpar - isso apagaria o conteúdo AR
                  if (!hasActiveTarget) {
                    // Sem target: limpar canvas para evitar área preta
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    
                    // No Android/Chrome, limpar novamente para garantir
                    if (needsAggressiveRAF) {
                      gl.clear(gl.COLOR_BUFFER_BIT)
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    }
                  }
                  // Se houver target ativo, NÃO limpar - apenas garantir clearColor está correto
                }
                
                // Forçar CSS transparente também
                canvas.style.setProperty('background-color', 'transparent', 'important')
                canvas.style.setProperty('background', 'transparent', 'important')
                canvas.style.setProperty('opacity', '1', 'important')
              } catch (e) {
                // Ignorar erro
              }
            }
            
            // Executar callback original (renderização do AR)
            callback(time)
            
            // DEPOIS de renderizar, garantir clearColor novamente (mas NÃO limpar se houver target)
            if (canvas && !hasActiveTarget) {
              try {
                const gl = getWebGLContext(canvas)
                if (gl && !gl.isContextLost()) {
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                }
              } catch (e) {
                // Ignorar erro
              }
            }
          })
        }
        window._rafIntercepted = true
        console.log('✅ requestAnimationFrame interceptado - limpando canvas apenas quando NÃO há targets ativos', needsAggressiveRAF ? '[Android/Chrome: modo ultra agressivo]' : '')
      }
      
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
        // NÃO usar opacity no background - A-Frame não suporta
        if (needsAggressiveFix) {
          scene.setAttribute('background', 'color: transparent')
          
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
              // Detectar Android/Chrome para aplicar correções mais agressivas
              const isAndroid = /Android/i.test(navigator.userAgent)
              const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
              const needsAggressiveFix = isAndroid && isChrome
              
              renderer._originalRender = renderer.render.bind(renderer)
              renderer.render = function(scene, camera) {
                // CRÍTICO: Garantir clearColor transparente antes de renderizar
                if (typeof renderer.setClearColor === 'function') {
                  renderer.setClearColor(0x000000, 0)
                }
                // CRÍTICO: Garantir WebGL clearColor transparente diretamente
                try {
                  // NÃO criar novo contexto via domElement - usar apenas renderer.getContext()
                  const gl = renderer.getContext && renderer.getContext()
                  if (gl && !gl.isContextLost()) {
                    // Interceptar clear() se ainda não foi interceptado
                    if (!gl._clearIntercepted) {
                      gl._originalClear = gl.clear.bind(gl)
                      gl.clear = function(mask) {
                        // Sempre garantir clearColor transparente antes de limpar
                        gl.clearColor(0.0, 0.0, 0.0, 0.0)
                        gl._originalClear(mask)
                        // No Android/Chrome, limpar novamente após a limpeza original
                        if (needsAggressiveFix) {
                          gl.clearColor(0.0, 0.0, 0.0, 0.0)
                          gl.clear(gl.COLOR_BUFFER_BIT)
                          gl.clearColor(0.0, 0.0, 0.0, 0.0)
                        }
                      }
                      gl._clearIntercepted = true
                      console.log('✅ WebGL clear() interceptado na função forceCanvasTransparency', needsAggressiveFix ? '[Android/Chrome: modo ultra agressivo]' : '')
                    }
                    
                    // No Android/Chrome, limpar TODO o canvas ANTES de renderizar
                    if (needsAggressiveFix) {
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    } else {
                      gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: totalmente transparente
                    }
                    gl.enable(gl.BLEND)
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                  }
                } catch (e) {
                  // Ignorar erro se não conseguir acessar WebGL
                }
                // Chamar render original
                renderer._originalRender(scene, camera)
                
                // No Android/Chrome, forçar clearColor novamente após renderizar E limpar canvas
                if (needsAggressiveFix) {
                  try {
                    // NÃO criar novo contexto via domElement - usar apenas renderer.getContext()
                    const gl = renderer.getContext && renderer.getContext()
                    if (gl && !gl.isContextLost()) {
                      // ULTRA AGRESSIVO: Limpar TODO o canvas novamente após renderizar
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                      gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    }
                  } catch (e) {
                    // Ignorar erro
                  }
                }
              }
              renderer._renderIntercepted = true
              if (needsAggressiveFix) {
                console.log('✅ Renderer.render interceptado com correção agressiva para Android/Chrome')
              }
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
        // NÃO criar novo contexto - usar contexto existente do renderer
        let gl = null
        try {
          const rendererSystem = scene.systems?.renderer
          if (rendererSystem) {
            const renderer = rendererSystem.renderer || rendererSystem
            if (renderer && typeof renderer.getContext === 'function') {
              gl = renderer.getContext()
            }
          }
        } catch (e) {
          // Ignorar erro
        }
        if (gl) {
          // Detectar Android/Chrome para aplicar correções mais agressivas
          const isAndroid = /Android/i.test(navigator.userAgent)
          const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
          const needsAggressiveFix = isAndroid && isChrome
          
          gl.clearColor(0.0, 0.0, 0.0, 0.0) // RGBA: transparente
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
          
          // Interceptar gl.clear() para garantir transparência
          if (!gl._originalClear) {
            gl._originalClear = gl.clear.bind(gl)
            gl.clear = function(mask) {
              // SEMPRE garantir clearColor com alpha 0 antes de limpar
              gl.clearColor(0.0, 0.0, 0.0, 0.0)
              // Permitir que a limpeza aconteça normalmente
              gl._originalClear(mask)
              // No Android/Chrome, forçar clearColor novamente após limpar E limpar novamente
              if (needsAggressiveFix) {
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                // Limpar novamente para garantir que não há área preta
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              }
            }
          }
          
          // No Android/Chrome, adicionar um intervalo que força clearColor a 0 continuamente
          if (needsAggressiveFix && !gl._androidClearColorInterval) {
            gl._androidClearColorInterval = setInterval(() => {
              try {
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
              } catch (e) {
                // Ignorar erros se o contexto foi perdido
              }
            }, 100) // A cada 100ms
          }
        }
      } catch (e) {
        console.warn('⚠️ Erro ao configurar transparência:', e)
      }
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
            // Também verificar elementos que cobrem parte significativa (20% ou mais)
            const coversLargeArea = rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.3
            const coversTopArea = rect.top < window.innerHeight * 0.5 && rect.width > window.innerWidth * 0.15
            const coversSignificantArea = (rect.width > window.innerWidth * 0.2 || rect.height > window.innerHeight * 0.2) &&
                                        (rect.width > 100 || rect.height > 100)
            
            if ((coversLargeArea || coversTopArea || coversSignificantArea) &&
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
    // No Android/Chrome, usar frequência ainda maior (50ms) para garantir transparência mais rapidamente
    if (transparencyIntervalRef.current) {
      clearInterval(transparencyIntervalRef.current)
    }
    const intervalTime = needsAggressiveFix ? 50 : 100 // 50ms no Android/Chrome, 100ms em outros
    transparencyIntervalRef.current = setInterval(() => {
      // Sempre garantir transparência do canvas
      forceCanvasTransparency()
      makeRendererTransparent()
      
      // No Android/Chrome, forçar transparência do canvas a cada frame usando requestAnimationFrame
      if (needsAggressiveFix) {
        const canvas = scene?.querySelector('canvas')
        if (canvas) {
          const gl = getWebGLContext(canvas)
          if (gl && !gl.isContextLost()) {
            // ULTRA AGRESSIVO: Limpar TODO o canvas com alpha 0 a cada verificação
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
          }
          // Forçar CSS também
          canvas.style.setProperty('background-color', 'transparent', 'important')
          canvas.style.setProperty('background', 'transparent', 'important')
          
          // Verificar se há algum elemento filho do canvas ou do a-scene com background preto
          // ESPECIALMENTE elementos no topo que podem estar cobrindo o vídeo
          const sceneChildren = scene.querySelectorAll('*')
          if (sceneChildren) {
            sceneChildren.forEach(child => {
              if (child === canvas || child.tagName === 'VIDEO' || child.tagName === 'CANVAS') return
              const childStyle = window.getComputedStyle(child)
              const bgColor = childStyle.backgroundColor
              const rect = child.getBoundingClientRect()
              
              if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
                // Verificar se está no topo cobrindo o vídeo OU se cobre grande área
                const coversTopArea = rect.top < window.innerHeight * 0.4 && 
                                     rect.width > window.innerWidth * 0.2 && 
                                     rect.height > window.innerHeight * 0.15
                const coversLargeArea = rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5
                
                if (coversLargeArea || coversTopArea) {
                  console.warn('⚠️ Elemento filho com background preto detectado no Android/Chrome, removendo:', {
                    tag: child.tagName,
                    id: child.id,
                    className: child.className,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                  })
                  child.style.setProperty('display', 'none', 'important')
                  child.style.setProperty('visibility', 'hidden', 'important')
                  child.style.setProperty('opacity', '0', 'important')
                  child.style.setProperty('background-color', 'transparent', 'important')
                  child.style.setProperty('background', 'transparent', 'important')
                  try {
                    child.remove()
                  } catch (e) {
                    // Ignorar erro
                  }
                }
              }
            })
          }
        }
      }
      
      // No Android/Chrome, forçar a-scene e seus elementos a serem transparentes
      if (needsAggressiveFix && scene) {
        // Forçar a-scene transparente
        scene.style.setProperty('background-color', 'transparent', 'important')
        scene.style.setProperty('background', 'transparent', 'important')
        scene.setAttribute('background', 'color: transparent')
        
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
        // Incluir elementos que cobrem parcialmente, especialmente no topo
        const allSceneElements = scene.querySelectorAll('*')
        allSceneElements.forEach(el => {
          if (el.tagName === 'CANVAS' || el.tagName === 'VIDEO' || el.id.includes('video')) {
            return // Ignorar canvas e vídeos
          }
          
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          const bgColor = style.backgroundColor
          
          // Verificar se tem background preto
          if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
            // Verificar se cobre grande área OU se está no topo cobrindo o vídeo
            const coversLargeArea = rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5
            const coversTopArea = rect.top < window.innerHeight * 0.3 && rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.2
            
            if (coversLargeArea || coversTopArea) {
              console.error('❌ ELEMENTO COM BACKGROUND PRETO DETECTADO E REMOVIDO:', {
                tag: el.tagName,
                id: el.id,
                className: el.className,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                backgroundColor: bgColor,
                coversLargeArea,
                coversTopArea
              })
              el.style.setProperty('display', 'none', 'important')
              el.style.setProperty('visibility', 'hidden', 'important')
              el.style.setProperty('opacity', '0', 'important')
              el.style.setProperty('pointer-events', 'none', 'important')
              el.style.setProperty('background-color', 'transparent', 'important')
              el.style.setProperty('background', 'transparent', 'important')
              try {
                el.remove()
              } catch (e) {
                console.warn('⚠️ Não foi possível remover elemento:', e)
              }
            }
          }
        })
      }
      
      // CRÍTICO: Loop contínuo para limpar canvas e remover elementos pretos
      // Executar a cada 50ms para garantir que o canvas seja sempre transparente
      // IMPORTANTE: NÃO limpar canvas quando há targets ativos (isso apagaria o AR)
      if (!window._canvasCleanupInterval) {
        window._canvasCleanupInterval = setInterval(() => {
          try {
            // Verificar se há target ativo (usar ref para acessar valor atual)
            const currentActiveTarget = activeTargetIndexRef.current !== null
            
            const canvas = scene.querySelector('canvas')
            if (canvas) {
              // Forçar CSS transparente
              canvas.style.setProperty('background-color', 'transparent', 'important')
              canvas.style.setProperty('background', 'transparent', 'important')
              canvas.style.setProperty('opacity', '1', 'important')
              
              // CRÍTICO: Verificar se o canvas está cobrindo parte do vídeo (especialmente no topo)
              const canvasRect = canvas.getBoundingClientRect()
              const canvasStyle = window.getComputedStyle(canvas)
              const canvasBgColor = canvasStyle.backgroundColor
              
              // Se o canvas tem background preto e está no topo, forçar transparência mais agressiva
              if (canvasRect.top <= window.innerHeight * 0.2 && 
                  (canvasBgColor.includes('rgb(0, 0, 0)') || canvasBgColor.includes('rgba(0, 0, 0, 1)'))) {
                console.warn('⚠️ Canvas detectado com background preto no topo, forçando transparência')
                canvas.style.setProperty('background-color', 'transparent', 'important')
                canvas.style.setProperty('background', 'transparent', 'important')
                canvas.style.setProperty('mix-blend-mode', 'normal', 'important')
              }
              
              // CRÍTICO: Só limpar canvas se NÃO houver targets ativos
              // Se houver target ativo, apenas garantir clearColor está em alpha 0, mas NÃO limpar
              // Limpar o canvas apagaria o conteúdo AR renderizado
              // Usar ref para acessar valor atual dentro do closure
              const hasActiveTarget = activeTargetIndexRef.current !== null
              
              const gl = getWebGLContext(canvas)
              if (gl && !gl.isContextLost()) {
                // Sempre garantir clearColor está em alpha 0
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                
                // Só limpar canvas completamente se NÃO houver target ativo
                if (!hasActiveTarget) {
                  // Sem target: limpar canvas completamente para evitar área preta
                  // ESPECIALMENTE importante limpar o topo do canvas
                  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                  gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  
                  // No Android/Chrome, limpar novamente para garantir que não há área preta no topo
                  const isAndroid = /Android/i.test(navigator.userAgent)
                  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)
                  if (isAndroid && isChrome) {
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                  }
                }
                // Se houver target ativo, NÃO limpar - apenas garantir clearColor está correto
              }
            }
            
            // Remover elementos com background preto que cobrem o vídeo
            const allElements = document.querySelectorAll('*')
            allElements.forEach(el => {
              if (el === canvas || el.tagName === 'VIDEO' || el.tagName === 'CANVAS' || el === scene) return
              
              const rect = el.getBoundingClientRect()
              const style = window.getComputedStyle(el)
              const bgColor = style.backgroundColor
              const zIndex = parseInt(style.zIndex) || 0
              
              // Verificar se tem background preto e está cobrindo área grande
              // Também verificar elementos que cobrem PARTE da tela (não apenas grande área)
              // ESPECIALMENTE elementos no topo que cobrem mesmo pequenas áreas
              if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
                const coversLargeArea = rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.3
                // CRÍTICO: Detectar elementos no topo que cobrem QUALQUER parte significativa (10% ou mais)
                const coversTopArea = rect.top <= window.innerHeight * 0.2 && 
                                     rect.width > window.innerWidth * 0.1 && 
                                     rect.height > window.innerHeight * 0.05
                // Verificar se cobre qualquer parte significativa da tela (15% ou mais)
                const coversSignificantArea = (rect.width > window.innerWidth * 0.15 || rect.height > window.innerHeight * 0.15) &&
                                            (rect.width > 50 || rect.height > 50) // Pelo menos 50px
                
                if ((coversLargeArea || coversTopArea || coversSignificantArea) && zIndex > -2 && zIndex < 100000) {
                  console.warn('⚠️ Elemento com background preto detectado no loop de limpeza, removendo:', {
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    zIndex: zIndex,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    backgroundColor: bgColor,
                    coversLargeArea,
                    coversTopArea,
                    coversSignificantArea
                  })
                  el.style.setProperty('display', 'none', 'important')
                  el.style.setProperty('visibility', 'hidden', 'important')
                  el.style.setProperty('opacity', '0', 'important')
                  el.style.setProperty('background-color', 'transparent', 'important')
                  el.style.setProperty('background', 'transparent', 'important')
                  try {
                    el.remove()
                  } catch (e) {
                    // Ignorar
                  }
                }
              }
            })
          } catch (e) {
            // Ignorar erros
          }
        }, 50) // A cada 50ms
        console.log('✅ Loop contínuo de limpeza de canvas ativado (a cada 50ms)')
      }
      
      // Verificar e corrigir elementos com background preto que possam estar cobrindo os vídeos
      // VERSÃO ULTRA AGRESSIVA: Verificar TODOS os elementos, incluindo os que cobrem parcialmente
      // ESPECIALMENTE elementos no topo da tela que podem estar cobrindo o vídeo
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        const style = window.getComputedStyle(el)
        const bgColor = style.backgroundColor
        const rect = el.getBoundingClientRect()
        const zIndex = parseInt(style.zIndex) || 0
        
        // Verificar se tem background preto ou quase preto
        if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
          // Ignorar elementos que devem ter background preto (como botões, etc)
          const tagName = el.tagName.toLowerCase()
          const className = el.className || ''
          const id = el.id || ''
          
          // Se não for um elemento de UI conhecido
          if (!['button', 'input', 'select', 'textarea'].includes(tagName) &&
              !className.includes('back-button') &&
              !className.includes('toggle') &&
              !className.includes('nav') &&
              !id.includes('ui-') &&
              !id.includes('loading') &&
              el.tagName !== 'CANVAS' &&
              el.tagName !== 'VIDEO') {
            
            // Verificar se está cobrindo uma grande parte da tela OU se está no topo cobrindo o vídeo
            const coversLargeArea = rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5
            // CRÍTICO: Detectar elementos no topo que cobrem QUALQUER parte (10% ou mais)
            // Especialmente importante para detectar áreas pretas no topo do vídeo
            const coversTopArea = rect.top <= window.innerHeight * 0.2 && 
                                 rect.width > window.innerWidth * 0.1 && 
                                 rect.height > window.innerHeight * 0.05
            // Verificar se cobre qualquer parte significativa (15% ou mais em qualquer dimensão)
            const coversSignificantArea = (rect.width > window.innerWidth * 0.15 || rect.height > window.innerHeight * 0.15) &&
                                        (rect.width > 50 || rect.height > 50) // Pelo menos 50px
            
            // Se está na frente do vídeo (z-index > -2) mas não é um elemento de UI
            if ((coversLargeArea || coversTopArea || coversSignificantArea) && zIndex > -2 && zIndex < 100000) {
              console.warn('⚠️ Elemento com background preto detectado cobrindo vídeo, forçando transparência:', {
                tag: el.tagName,
                id: el.id,
                className: el.className,
                zIndex: zIndex,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                backgroundColor: bgColor,
                coversLargeArea,
                coversTopArea
              })
              el.style.setProperty('background-color', 'transparent', 'important')
              el.style.setProperty('background', 'transparent', 'important')
              el.style.setProperty('opacity', '1', 'important')
              
              // Se ainda estiver cobrindo, tentar remover ou esconder
              if (coversLargeArea || coversTopArea) {
                el.style.setProperty('display', 'none', 'important')
                el.style.setProperty('visibility', 'hidden', 'important')
                try {
                  el.remove()
                } catch (e) {
                  // Ignorar se não puder remover
                }
              }
            }
          }
        }
      })
      
      // Garantir que o vídeo da câmera esteja visível (usando a função simplificada)
      if (ensureCameraVideoVisibleRef.current) {
        ensureCameraVideoVisibleRef.current()
      }
    }, intervalTime) // Verificar a cada 50ms no Android/Chrome, 100ms em outros

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

  // Garantir que body e html sejam transparentes quando a scan page estiver montada
  useEffect(() => {
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')
    document.body.style.setProperty('background-color', 'transparent', 'important')
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background-color', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    
    // Função de debug global para inspecionar elementos no mobile
    // Criar função diretamente sem verificação condicional para garantir disponibilidade
    window.debugScanPage = function() {
      const scene = sceneRef.current
      const canvas = scene?.querySelector('canvas')
      const video = document.querySelector('#arVideo') || document.querySelector('video[id^="mindar"]')
      
      const report = {
        canvas: canvas ? {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          display: window.getComputedStyle(canvas).display,
          visibility: window.getComputedStyle(canvas).visibility,
          opacity: window.getComputedStyle(canvas).opacity,
          backgroundColor: window.getComputedStyle(canvas).backgroundColor,
          zIndex: window.getComputedStyle(canvas).zIndex,
          position: window.getComputedStyle(canvas).position,
          hasWebGL: (() => {
            try {
              const rendererSystem = scene.systems?.renderer
              if (rendererSystem) {
                const renderer = rendererSystem.renderer || rendererSystem
                if (renderer && typeof renderer.getContext === 'function') {
                  const gl = renderer.getContext()
                  return !!(gl && !gl.isContextLost())
                }
              }
            } catch (e) {
              // Ignorar erro
            }
            return false
          })()
        } : { exists: false },
        video: video ? {
          exists: true,
          width: video.videoWidth,
          height: video.videoHeight,
          display: window.getComputedStyle(video).display,
          visibility: window.getComputedStyle(video).visibility,
          opacity: window.getComputedStyle(video).opacity,
          zIndex: window.getComputedStyle(video).zIndex,
          position: window.getComputedStyle(video).position,
          isPlaying: !video.paused && !video.ended
        } : { exists: false },
        blackElements: []
      }
      
      // Procurar elementos com background preto - VERSÃO MELHORADA
      document.querySelectorAll('*').forEach(el => {
        if (el === canvas || el === video || el.tagName === 'VIDEO' || el.tagName === 'CANVAS') return
        const style = window.getComputedStyle(el)
        const bgColor = style.backgroundColor
        const rect = el.getBoundingClientRect()
        const zIndex = parseInt(style.zIndex) || 0
        
        // Verificar se tem background preto
        if (bgColor && (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0, 1)') || bgColor === '#000000' || bgColor === '#000')) {
          // Verificar se cobre área significativa (20% ou mais) OU está no topo
          const coversLargeArea = rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.3
          const coversTopArea = rect.top < window.innerHeight * 0.5 && rect.width > window.innerWidth * 0.15
          const coversSignificantArea = (rect.width > window.innerWidth * 0.2 || rect.height > window.innerHeight * 0.2) &&
                                      (rect.width > 100 || rect.height > 100)
          
          // Se está na frente do vídeo (z-index > -2)
          if ((coversLargeArea || coversTopArea || coversSignificantArea) && zIndex > -2 && zIndex < 100000) {
            report.blackElements.push({
              tag: el.tagName,
              id: el.id || '(sem id)',
              className: el.className || '(sem classe)',
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              backgroundColor: bgColor,
              zIndex: style.zIndex,
              position: style.position,
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              coversLargeArea,
              coversTopArea,
              coversSignificantArea,
              element: el // Referência ao elemento para fácil acesso
            })
          }
        }
      })
      
      // Se encontrou elementos pretos, tentar removê-los automaticamente
      if (report.blackElements.length > 0) {
        console.error('❌ ELEMENTOS COM BACKGROUND PRETO DETECTADOS:', report.blackElements)
        report.blackElements.forEach(item => {
          if (item.element) {
            console.warn('🔧 Tentando remover elemento preto:', item)
            item.element.style.setProperty('display', 'none', 'important')
            item.element.style.setProperty('visibility', 'hidden', 'important')
            item.element.style.setProperty('opacity', '0', 'important')
            item.element.style.setProperty('background-color', 'transparent', 'important')
            try {
              item.element.remove()
            } catch (e) {
              console.warn('⚠️ Não foi possível remover elemento:', e)
            }
          }
        })
      }
      
      console.log('📊 ScanPage Debug Report:', report)
      return report
    }
    
    // Garantir que a função esteja disponível imediatamente
    if (typeof window.debugScanPage === 'function') {
      console.log('✅ Função debugScanPage() disponível - chame window.debugScanPage() no console')
    } else {
      console.error('❌ ERRO: debugScanPage não foi criada!')
    }
    
    // Forçar criação novamente se não estiver disponível (fallback)
    if (typeof window.debugScanPage !== 'function') {
      console.warn('⚠️ Tentando criar debugScanPage novamente...')
      window.debugScanPage = function() {
        console.error('❌ debugScanPage não foi inicializada corretamente. Recarregue a página.')
        return { error: 'Function not initialized' }
      }
    }
    
    return () => {
      document.body.classList.remove('scan-page-active')
      document.documentElement.classList.remove('scan-page-active')
      // NÃO deletar a função no cleanup para que ela permaneça disponível durante a sessão
      // delete window.debugScanPage
      
      // Restaurar console.error original
      if (console.error._originalError) {
        console.error = console.error._originalError
      }
    }
  }, [])

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
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 0; autoStart: true; showStats: false; uiScanning: none; uiLoading: none; uiError: none;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer={`colorManagement: true; physicallyCorrectLights: true; antialias: true; alpha: true; precision: highp; logarithmicDepthBuffer: true; preserveDrawingBuffer: ${/Android/i.test(navigator.userAgent) ? 'false' : 'true'}; powerPreference: high-performance;`}
        embedded
        background="color: transparent"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: /Android/i.test(navigator.userAgent) && activeTargetIndex === null ? -1 : 1, // No Android sem targets, colocar atrás do vídeo
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          opacity: 1,
          display: /Android/i.test(navigator.userAgent) && activeTargetIndex === null ? 'none' : 'block' // No Android sem targets, ocultar completamente
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
