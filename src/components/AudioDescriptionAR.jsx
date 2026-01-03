import React, { useState, useRef, useEffect } from 'react'

const AudioDescriptionAR = ({ audioActive, videoState, activeTargetIndex }) => {
  const audioRef = useRef(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  
  // Determinar qual arquivo de audiodescrição usar baseado no target ativo
  const getAudioSource = () => {
    if (activeTargetIndex === 1) {
      // Segundo target (target1, video2) - usar ad_anim_3.m4a
      return '/ayamioja-ra/ar-assets/assets/ads/ad_anim_3.m4a'
    } else if (activeTargetIndex === 2) {
      // Terceiro target (target2, video3) - usar ad_anim_2.m4a
      return '/ayamioja-ra/ar-assets/assets/ads/ad_anim_2.m4a'
    } else if (activeTargetIndex === 0) {
      // Primeiro target (target0, video1) - não há arquivo específico ainda
      // Por enquanto, usar o mesmo do target 2 ou retornar null
      return '/ayamioja-ra/ar-assets/assets/ads/ad_anim_2.m4a'
    }
    // Nenhum target ativo
    return null
  }
  
  const audioSource = getAudioSource()

  // Carregar e preparar o áudio quando o componente montar ou quando o target mudar
  useEffect(() => {
    const audio = audioRef.current
    
    if (!audio) {
      console.log('❌ AudioDescriptionAR: audioRef.current é null')
      return
    }

    // Se não há target ativo ou não há arquivo de áudio, não fazer nada
    if (!audioSource || activeTargetIndex === null) {
      setIsAudioReady(false)
      audio.pause()
      return
    }

    // Configurar volume do áudio de audiodescrição (mais alto quando ativo)
    audio.volume = 1.0 // Volume alto para audiodescrição (100%)

    console.log(`🎧 AudioDescriptionAR: Carregando áudio para target ${activeTargetIndex}:`, audioSource)

    const handleCanPlay = () => {
      console.log(`✅ Áudio de Audiodescrição AR pronto para reproduzir (target ${activeTargetIndex})`)
      setIsAudioReady(true)
      // Garantir volume configurado (alto para audiodescrição)
      audio.volume = 1.0
    }

    const handleLoadedData = () => {
      console.log(`✅ Áudio de Audiodescrição AR - dados carregados (target ${activeTargetIndex})`)
      setIsAudioReady(true)
      // Garantir volume configurado (alto para audiodescrição)
      audio.volume = 1.0
    }

    const handleError = (e) => {
      console.error(`❌ Erro ao carregar áudio de Audiodescrição AR (target ${activeTargetIndex}):`, e)
      setIsAudioReady(false)
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    
    // Atualizar a fonte do áudio se necessário
    const source = audio.querySelector('source')
    if (source && source.src !== audioSource) {
      source.src = audioSource
      console.log(`🔄 Atualizando fonte do áudio para: ${audioSource}`)
    }
    
    console.log(`⏳ Forçando carregamento do áudio de Audiodescrição AR para target ${activeTargetIndex}...`)
    setIsAudioReady(false)
    audio.load() // Forçar carregamento

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
    }
  }, [activeTargetIndex, audioSource])

  // CRÍTICO: Usar useRef para evitar logs repetidos
  const prevAudioActive = useRef(audioActive)
  const prevVideoState = useRef(videoState)
  
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      // Só logar uma vez quando não há áudio
      if (!prevAudioActive.current) {
        console.log('❌ AudioDescriptionAR: Áudio ref não disponível')
      }
      return
    }

    // Só logar quando valores realmente mudarem
    if (prevAudioActive.current !== audioActive || prevVideoState.current !== videoState) {
      console.log('🎧 AudioDescriptionAR - audioActive:', audioActive, 'videoState:', videoState, 'isAudioReady:', isAudioReady)
      prevAudioActive.current = audioActive
      prevVideoState.current = videoState
    }

    if (!isAudioReady) {
      console.log('⏳ AudioDescriptionAR: Áudio ainda não está pronto, aguardando...')
      return
    }

    // Se Audiodescrição está ativo
    if (audioActive) {
      // Vídeo AR está reproduzindo
      if (videoState?.isPlaying) {
        console.log('✅ Reproduzindo áudio de Audiodescrição AR - videoState.currentTime:', videoState.currentTime)
        
        // Sincronizar com o vídeo AR apenas se houver diferença significativa
        const timeDiff = Math.abs(audio.currentTime - videoState.currentTime)
        if (timeDiff > 0.5) {
          console.log('🔄 Sincronizando Audiodescrição AR - diff:', timeDiff.toFixed(2), 's')
          audio.currentTime = videoState.currentTime
        }
        
        // Reproduzir áudio de Audiodescrição
        if (audio.paused) {
          // Garantir volume configurado antes de reproduzir (alto para audiodescrição)
          audio.volume = 1.0
          console.log('▶️ Reproduzindo áudio de Audiodescrição AR')
          audio.play()
            .then(() => {
              console.log('✅ Áudio de Audiodescrição AR reproduzindo')
              // Garantir volume após play (alto para audiodescrição)
              audio.volume = 1.0
            })
            .catch(e => console.log('❌ Erro ao reproduzir áudio de audiodescrição AR:', e))
        } else {
          // Se já está reproduzindo, garantir volume e sincronização (alto para audiodescrição)
          audio.volume = 1.0
          // Sincronizar continuamente durante reprodução
          const timeDiff = Math.abs(audio.currentTime - videoState.currentTime)
          if (timeDiff > 0.5) {
            audio.currentTime = videoState.currentTime
          }
        }
      } else {
        // Vídeo AR pausado/terminou - PAUSAR áudio
        console.log('⏸️ Vídeo AR pausado - pausando áudio de Audiodescrição AR')
        audio.pause()
      }
    } else {
      // Audiodescrição desativado
      console.log('❌ Pausando áudio de Audiodescrição AR (toggle desativado)')
      audio.pause()
    }
  }, [audioActive, videoState, isAudioReady])

  // Não renderizar se não há target ativo
  if (!audioSource || activeTargetIndex === null) {
    return null
  }

  return (
    <audio 
      ref={audioRef}
      className="audio-description-ar"
      loop={false}
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src={audioSource} type="audio/mp4" />
      <source src={audioSource} type="audio/mpeg" />
    </audio>
  )
}

export default AudioDescriptionAR

