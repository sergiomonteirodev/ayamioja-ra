import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
// import InterpreterVideo from '../components/InterpreterVideo' // DESATIVADO - vídeo de libras desativado
import SafeImage from '../components/SafeImage'
import AudioDescriptionAR from '../components/AudioDescriptionAR'

const ScanPage = () => {
  const [librasActive, setLibrasActive] = useState(true)
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [activeTargetIndex, setActiveTargetIndex] = useState(null)
  const [arVideoStates, setArVideoStates] = useState({})
  const [isArReady, setIsArReady] = useState(false)
  const [showScanningAnimation, setShowScanningAnimation] = useState(true)
  const [deviceOrientation, setDeviceOrientation] = useState('portrait')
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  
  const sceneRef = useRef(null)
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
      console.log('✅ Permissão concedida. MindAR iniciado.')
      
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

  // MindAR + A-Frame. scan-page-active para CSS.
  useEffect(() => {
    document.body.classList.add('scan-page-active')
    document.documentElement.classList.add('scan-page-active')

    const scene = sceneRef.current
    if (!scene) {
      console.log('❌ Scene ref não encontrada')
      return
    }
    
    // MindAR controla a interação (câmera, target, exibição). Nós reagimos a targetFound/targetLost
    // mantendo: play/pause, visible, activeTargetIndex, showScanningAnimation → AD, Libras, overlay.
    const handleSceneLoaded = () => {
        setTimeout(() => {
        const target0 = document.getElementById('target0')
        const target1 = document.getElementById('target1')
        const target2 = document.getElementById('target2')

        // Aspect 5:2 nos planos (vídeos são 5:2); reduz letterboxing.
        const R = 2.5
        ;['videoPlane0','videoPlane1','videoPlane2'].forEach(id => {
          const p = document.getElementById(id)
          if (p) { p.setAttribute('width', R.toFixed(3)); p.setAttribute('height', '1') }
        })

        const isAndroid = /Android/i.test(navigator.userAgent)
        const showPlane = (plane, video) => {
          if (!plane) return
          if (!video) { plane.setAttribute('visible', 'true'); return }
          video.muted = false
          video.play().catch(() => {})
          if (isAndroid) {
            const onPlaying = () => {
              video.removeEventListener('playing', onPlaying)
              plane.setAttribute('visible', 'true')
            }
            if (video.readyState >= 2 && !video.paused) plane.setAttribute('visible', 'true')
            else video.addEventListener('playing', onPlaying, { once: true })
          } else {
            plane.setAttribute('visible', 'true')
          }
        }

        // Target 0
        if (target0) {
          target0.addEventListener('targetFound', () => {
            setActiveTargetIndex(0)
            setShowScanningAnimation(false)
            showPlane(document.getElementById('videoPlane0'), document.getElementById('video1'))
          })
          target0.addEventListener('targetLost', () => {
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            const v = document.getElementById('video1')
            const p = document.getElementById('videoPlane0')
            if (v) v.pause()
            if (p) p.setAttribute('visible', 'false')
          })
        }

        // Target 1
        if (target1) {
          target1.addEventListener('targetFound', () => {
            setActiveTargetIndex(1)
            setShowScanningAnimation(false)
            showPlane(document.getElementById('videoPlane1'), document.getElementById('video2'))
          })
          target1.addEventListener('targetLost', () => {
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            const v = document.getElementById('video2')
            const p = document.getElementById('videoPlane1')
            if (v) v.pause()
            if (p) p.setAttribute('visible', 'false')
          })
        }

        // Target 2
        if (target2) {
          target2.addEventListener('targetFound', () => {
            setActiveTargetIndex(2)
            setShowScanningAnimation(false)
            showPlane(document.getElementById('videoPlane2'), document.getElementById('video3'))
          })
          target2.addEventListener('targetLost', () => {
            setActiveTargetIndex(null)
            setShowScanningAnimation(true)
            const v = document.getElementById('video3')
            const p = document.getElementById('videoPlane2')
            if (v) v.pause()
            if (p) p.setAttribute('visible', 'false')
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

      {/* Vídeo de fundo da câmera - MindAR gerencia o vídeo da câmera (#arVideo) */}

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

      {/* A-Frame + MindAR */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.1; missTolerance: 15; warmupTolerance: 3; autoStart: false; showStats: false;"
        color-space="sRGB"
        renderer="colorManagement: true; physicallyCorrectLights: true; antialias: false; precision: mediump;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        embedded
        ui="enabled: false"
      >
        {/* Assets - Vídeos */}
        <a-assets>
          {/* Target 0 → video1 → anim_4.mp4 */}
          <video id="video1" src="/ayamioja-ra/ar-assets/assets/anim_4.mp4" preload="auto" crossOrigin="anonymous" playsInline />
          {/* Target 1 → video2 → anim_3.mp4 */}
          <video id="video2" src="/ayamioja-ra/ar-assets/assets/anim_3.mp4" preload="auto" crossOrigin="anonymous" loop playsInline />
          {/* Target 2 → video3 → anim_2.mp4 */}
          <video id="video3" src="/ayamioja-ra/ar-assets/assets/anim_2.mp4" preload="auto" crossOrigin="anonymous" loop playsInline />
        </a-assets>

        {/* Targets – como backup: flat src sem side:double; posições 0 0.1 0.1 / 0 0 0.005 */}
        <a-entity id="target0" mindar-image-target="targetIndex: 0">
          <a-plane
            id="videoPlane0"
            width="1"
            height="1"
            position="0 0.1 0.1"
            material="shader: flat; src: #video1"
            visible="false"
          ></a-plane>
        </a-entity>

        <a-entity id="target1" mindar-image-target="targetIndex: 1">
          <a-plane
            id="videoPlane1"
            width="1"
            height="1"
            position="0 0.1 0.1"
            material="shader: flat; src: #video2"
            visible="false"
          ></a-plane>
        </a-entity>

        <a-entity id="target2" mindar-image-target="targetIndex: 2">
          <a-plane
            id="videoPlane2"
            width="1"
            height="1"
            position="0 0 0.005"
            material="shader: flat; src: #video3"
            visible="false"
          ></a-plane>
        </a-entity>

        {/* Camera */}
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      </a-scene>

      <div id="ui-scanning" style={{ display: 'none' }} aria-hidden="true" />
      {!isArReady && (
        <div id="ui-loading" className="ui-loading" style={{ display: 'flex' }}>
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Carregando AR...</p>
          </div>
        </div>
      )}

      {/* Aponte a câmera */}
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
