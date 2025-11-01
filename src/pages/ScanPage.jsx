import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
import InterpreterVideo from '../components/InterpreterVideo'
import SafeImage from '../components/SafeImage'

const ScanPage = () => {
  const [librasActive, setLibrasActive] = useState(true) // ✅ Iniciar com Libras ativado
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [activeTargetIndex, setActiveTargetIndex] = useState(null)
  const [arVideoStates, setArVideoStates] = useState({})
  const [isArReady, setIsArReady] = useState(false)
  const [showScanningAnimation, setShowScanningAnimation] = useState(true)
  const [currentLibrasVideo, setCurrentLibrasVideo] = useState(null)
  const [deviceOrientation, setDeviceOrientation] = useState('portrait') // 'portrait' ou 'landscape'
  
  const sceneRef = useRef(null)
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
    navigate('/')
  }

  // Detectar orientação do dispositivo e ajustar vídeos AR quando houver mudança
  useEffect(() => {
    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      const newOrientation = isPortrait ? 'portrait' : 'landscape'
      setDeviceOrientation(newOrientation)
      console.log('📱 Orientação do dispositivo:', newOrientation)
      
      // Ajustar vídeos AR quando a orientação mudar
      const adjustVideos = () => {
        const videoElements = [
          document.querySelector('#target0 a-video'),
          document.querySelector('#target1 a-video'),
          document.querySelector('#target2 a-video')
        ]
        
        videoElements.forEach((videoEl, index) => {
          if (videoEl) {
            // Sempre manter proporção do livro aberto (largura > altura)
            videoEl.setAttribute('rotation', '0 0 -90')
            videoEl.setAttribute('width', '1.6') // Largura maior para livro aberto
            videoEl.setAttribute('height', '0.8') // Altura menor para livro aberto
            console.log(`📐 Vídeo AR ${index} ajustado para ${newOrientation}`)
          }
        })
      }
      
      // Aguardar um pouco para garantir que os elementos estão prontos
      setTimeout(adjustVideos, 200)
    }
    
    // Ouvir mudanças de orientação
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', () => {
      // Delay maior para aguardar a mudança de orientação completar
      setTimeout(updateOrientation, 500)
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
    if (activeTargetIndex === null) return

    const videoId = `video${activeTargetIndex + 1}`
    const video = document.getElementById(videoId)
    
    if (!video) return

    const updateVideoState = () => {
      if (!video.paused) {
        console.log(`🔄 Atualizando videoState - target ${activeTargetIndex}, time: ${video.currentTime.toFixed(2)}s`)
        setVideoState({
          isPlaying: !video.paused,
          currentTime: video.currentTime
        })
      }
    }

    // Atualizar a cada 100ms para manter sincronização
    const interval = setInterval(updateVideoState, 100)

    return () => clearInterval(interval)
  }, [activeTargetIndex])

  // Configurar MindAR quando o componente montar
  useEffect(() => {
    console.log('🎯 Iniciando configuração do AR...')
    
    const scene = sceneRef.current
    if (!scene) {
      console.log('❌ Scene ref não encontrada')
      return
    }

    // Aguardar o A-Frame carregar completamente
    const handleSceneLoaded = () => {
      console.log('✅ Scene A-Frame carregada')
      
      // Ajustar orientação dos vídeos AR quando o scene estiver pronto
      const adjustVideosOrientation = () => {
        const isPortrait = window.innerHeight > window.innerWidth
        const videoElements = [
          document.querySelector('#target0 a-video'),
          document.querySelector('#target1 a-video'),
          document.querySelector('#target2 a-video')
        ]
        
        videoElements.forEach((videoEl, index) => {
          if (videoEl) {
            // Sempre manter proporção do livro aberto (largura > altura)
            videoEl.setAttribute('rotation', '0 0 -90')
            videoEl.setAttribute('width', '1.6') // Largura maior para livro aberto
            videoEl.setAttribute('height', '0.8') // Altura menor para livro aberto
            console.log(`📐 Vídeo AR ${index} ajustado para orientação: ${isPortrait ? 'portrait' : 'landscape'}`)
          }
        })
      }
      
      // Aguardar um pouco mais para garantir que todos os elementos estão prontos
      setTimeout(() => {
        console.log('🔍 Procurando targets...')
        
        // Ajustar orientação após os elementos estarem prontos
        adjustVideosOrientation()
        
        // Configurar eventos de target
        const target0 = document.getElementById('target0')
        const target1 = document.getElementById('target1')
        const target2 = document.getElementById('target2')
        
        console.log('Targets encontrados:', { target0: !!target0, target1: !!target1, target2: !!target2 })
        
        // Log adicional para debug
        if (!target0 && !target1 && !target2) {
          console.error('⚠️ NENHUM TARGET ENCONTRADO! Verifique os IDs dos elementos a-entity')
        } else {
          console.log('✅ Event listeners serão adicionados aos targets encontrados')
        }

      if (target0) {
        target0.addEventListener('targetFound', () => {
          console.log('🎯 Target 0 encontrado')
          setActiveTargetIndex(0)
          setShowScanningAnimation(false)
          
          const librasVideoSrc = '/ayamioja-ra/videos/libras_anim_ayo.mp4'
          console.log('📹 Carregando vídeo de Libras:', librasVideoSrc)
          setCurrentLibrasVideo(librasVideoSrc)
          
          const video = document.getElementById('video1')
          if (video) {
            console.log('▶️ Reproduzindo vídeo AR 1')
            video.play().catch(e => console.log('Erro ao reproduzir vídeo 1:', e))
            
            const newVideoState = { isPlaying: true, currentTime: video.currentTime }
            console.log('🔄 Definindo videoState:', newVideoState)
            
            setArVideoStates(prev => ({
              ...prev,
              0: newVideoState
            }))
            setVideoState(newVideoState)
          }
        })

        target0.addEventListener('targetLost', () => {
          console.log('❌ Target 0 perdido - pausando vídeos mas mantendo toggle')
          setActiveTargetIndex(null)
          setShowScanningAnimation(true)
          // NÃO limpar currentLibrasVideo - manter para quando detectar novamente
          
          const video = document.getElementById('video1')
          if (video) {
            video.pause()
            setArVideoStates(prev => ({
              ...prev,
              0: { isPlaying: false, currentTime: video.currentTime }
            }))
            setVideoState({ isPlaying: false, currentTime: video.currentTime })
          }
        })
      }

      if (target1) {
        target1.addEventListener('targetFound', () => {
          console.log('🎯 Target 1 encontrado')
          setActiveTargetIndex(1)
          setShowScanningAnimation(false)
          
          const librasVideoSrc = '/ayamioja-ra/videos/libras_anim_ayo_2.mp4'
          console.log('📹 Carregando vídeo de Libras:', librasVideoSrc)
          setCurrentLibrasVideo(librasVideoSrc)
          
          const video = document.getElementById('video2')
          if (video) {
            console.log('▶️ Reproduzindo vídeo AR 2')
            video.play().catch(e => console.log('Erro ao reproduzir vídeo 2:', e))
            
            const newVideoState = { isPlaying: true, currentTime: video.currentTime }
            console.log('🔄 Definindo videoState:', newVideoState)
            
            setArVideoStates(prev => ({
              ...prev,
              1: newVideoState
            }))
            setVideoState(newVideoState)
          }
        })

        target1.addEventListener('targetLost', () => {
          console.log('❌ Target 1 perdido - pausando vídeos mas mantendo toggle')
          setActiveTargetIndex(null)
          setShowScanningAnimation(true)
          // NÃO limpar currentLibrasVideo - manter para quando detectar novamente
          
          const video = document.getElementById('video2')
          if (video) {
            video.pause()
            setArVideoStates(prev => ({
              ...prev,
              1: { isPlaying: false, currentTime: video.currentTime }
            }))
            setVideoState({ isPlaying: false, currentTime: video.currentTime })
          }
        })
      }

      if (target2) {
        target2.addEventListener('targetFound', () => {
          console.log('🎯 Target 2 encontrado')
          setActiveTargetIndex(2)
          setShowScanningAnimation(false)
          
          const librasVideoSrc = '/ayamioja-ra/videos/libras_anim_ayo.mp4'
          console.log('📹 Carregando vídeo de Libras:', librasVideoSrc)
          setCurrentLibrasVideo(librasVideoSrc)
          
          const video = document.getElementById('video3')
          if (video) {
            console.log('▶️ Reproduzindo vídeo AR 3')
            video.play().catch(e => console.log('Erro ao reproduzir vídeo 3:', e))
            
            const newVideoState = { isPlaying: true, currentTime: video.currentTime }
            console.log('🔄 Definindo videoState:', newVideoState)
            
            setArVideoStates(prev => ({
              ...prev,
              2: newVideoState
            }))
            setVideoState(newVideoState)
          }
        })

        target2.addEventListener('targetLost', () => {
          console.log('❌ Target 2 perdido - pausando vídeos mas mantendo toggle')
          setActiveTargetIndex(null)
          setShowScanningAnimation(true)
          // NÃO limpar currentLibrasVideo - manter para quando detectar novamente
          
          const video = document.getElementById('video3')
          if (video) {
            video.pause()
            setArVideoStates(prev => ({
              ...prev,
              2: { isPlaying: false, currentTime: video.currentTime }
            }))
            setVideoState({ isPlaying: false, currentTime: video.currentTime })
          }
        })
      }
      }, 1500) // setTimeout delay
    }
    
    scene.addEventListener('loaded', handleSceneLoaded)
    
    // Adicionar listener para quando o AR estiver pronto
    scene.addEventListener('arReady', () => {
      console.log('✅ MindAR pronto! Escondendo loading...')
      setIsArReady(true)
      
      // Esconder UI de loading manualmente
      const uiLoading = document.getElementById('ui-loading')
      if (uiLoading) {
        uiLoading.style.display = 'none'
        console.log('✅ UI Loading escondida')
      }
    })
    
    scene.addEventListener('arError', (event) => {
      console.log('❌ Erro no MindAR:', event.detail)
      setIsArReady(false)
    })

    // Fallback: forçar esconder loading após 5 segundos se o evento não disparar
    const fallbackTimeout = setTimeout(() => {
      if (!isArReady) {
        console.log('⚠️ Fallback: forçando esconder loading após 5s')
        setIsArReady(true)
        const uiLoading = document.getElementById('ui-loading')
        if (uiLoading) {
          uiLoading.style.display = 'none'
        }
      }
    }, 5000)

    return () => {
      scene.removeEventListener('loaded', handleSceneLoaded)
      clearTimeout(fallbackTimeout)
    }
  }, [])

  return (
    <div className="scan-page">
      {/* Toggles de Libras e Audiodescrição no topo */}
      <ToggleControls 
        onLibrasToggle={handleLibrasToggle}
        onAudioToggle={handleAudioToggle}
        showLogo={false}
        initialLibrasActive={true}
      />

      {/* Botão Voltar como overlay */}
      <div className="back-button-overlay" onClick={handleBackClick}>
        <SafeImage src="/ayamioja-ra/images/voltar_botao.png" alt="Voltar" className="back-button-image-overlay" />
      </div>

      {/* A-Frame Scene */}
      <a-scene 
        ref={sceneRef}
        mindar-image="imageTargetSrc: /ayamioja-ra/ar-assets/targets/targets(13).mind; maxTrack: 3; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 0; autoStart: true; showStats: false; uiScanning: none; uiLoading: none;"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        renderer="colorManagement: true; physicallyCorrectLights: true; antialias: true; alpha: true; precision: highp; logarithmicDepthBuffer: true"
        embedded
        style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1}}
      >
        {/* Assets */}
        <a-assets>
          <video 
            id="video1" 
            src="/ayamioja-ra/ar-assets/assets/ayo_teste.mp4" 
            loop 
            playsInline
            crossOrigin="anonymous"
            preload="auto"
          ></video>
          <video 
            id="video2" 
            src="/ayamioja-ra/ar-assets/assets/ayo_teste.mp4" 
            loop 
            playsInline
            crossOrigin="anonymous"
            preload="auto"
          ></video>
          <video 
            id="video3" 
            src="/ayamioja-ra/ar-assets/assets/anim_2.mp4" 
            loop
            playsInline
            crossOrigin="anonymous"
            preload="auto"
          ></video>
        </a-assets>

        {/* Targets */}
        <a-entity id="target0" mindar-image-target="targetIndex: 0">
          <a-video 
            src="#video1" 
            position="0 0 0" 
            rotation="0 0 -90" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; opacity: 1"
          ></a-video>
        </a-entity>

        <a-entity id="target1" mindar-image-target="targetIndex: 1">
          <a-video 
            src="#video2" 
            position="0 0 0" 
            rotation="0 0 -90" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; opacity: 1"
          ></a-video>
        </a-entity>

        <a-entity id="target2" mindar-image-target="targetIndex: 2">
          <a-video 
            src="#video3" 
            position="0 0 0" 
            rotation="0 0 -90" 
            width="1.6" 
            height="0.8"
            material="shader: flat; side: double; opacity: 1"
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


      {/* Animação de Scanning - só mostra quando não detectar nenhum target */}
      {isArReady && showScanningAnimation && activeTargetIndex === null && (
        <div className="ar-scanning-overlay">
          <div className="scanning-circles">
            <div className="scanning-circle-outer"></div>
            <div className="scanning-circle-inner"></div>
          </div>
          <p className="scanning-instruction">Aponte a câmera para o livro</p>
        </div>
      )}

      {/* Vídeo de Libras */}
      <InterpreterVideo 
        librasActive={librasActive}
        videoState={videoState}
        customVideoSrc={currentLibrasVideo}
      />

      {/* Rodapé */}
      <footer className="scan-footer">
        Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados
      </footer>
    </div>
  )
}

export default ScanPage
