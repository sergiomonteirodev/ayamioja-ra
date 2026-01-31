import React, { useState, useRef, useEffect } from 'react'

const AudioDescriptionAR = ({ audioActive, videoState, activeTargetIndex }) => {
  const audioRef = useRef(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  
  // Determinar qual arquivo de audiodescrição usar baseado no target ativo
  const getAudioSource = () => {
    if (activeTargetIndex === 0) {
      // Primeiro target (target0, video1 - anim_4.mp4) - usar ad_anim_4.m4a
      return '/ar-assets/assets/ads/ad_anim_4.m4a'
    } else if (activeTargetIndex === 1) {
      // Segundo target (target1, video2 - anim_3.mp4) - usar ad_anim_3.m4a
      return '/ar-assets/assets/ads/ad_anim_3.m4a'
    } else if (activeTargetIndex === 2) {
      // Terceiro target (target2, video3 - anim_2.mp4) - usar ad_anim_2.m4a
      return '/ar-assets/assets/ads/ad_anim_2.m4a'
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

  // CRÍTICO: Usar useRef para evitar logs repetidos e rastrear estado anterior
  const prevAudioActive = useRef(audioActive)
  const prevIsPlaying = useRef(videoState?.isPlaying)
  const prevIsAudioReady = useRef(isAudioReady)
  const hasLoggedNoAudio = useRef(false)
  
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      // Só logar uma vez quando não há áudio
      if (!hasLoggedNoAudio.current) {
        console.log('❌ AudioDescriptionAR: Áudio ref não disponível')
        hasLoggedNoAudio.current = true
      }
      return
    }
    hasLoggedNoAudio.current = false

    // Só logar quando valores realmente mudarem (não a cada mudança de currentTime)
    const audioActiveChanged = prevAudioActive.current !== audioActive
    const isPlayingChanged = prevIsPlaying.current !== videoState?.isPlaying
    const isAudioReadyChanged = prevIsAudioReady.current !== isAudioReady
    
    if (audioActiveChanged || isPlayingChanged || isAudioReadyChanged) {
      console.log('🎧 AudioDescriptionAR - audioActive:', audioActive, 'isPlaying:', videoState?.isPlaying, 'isAudioReady:', isAudioReady)
      prevAudioActive.current = audioActive
      prevIsPlaying.current = videoState?.isPlaying
      prevIsAudioReady.current = isAudioReady
    }

    if (!isAudioReady) {
      // Só logar uma vez quando não está pronto
      if (isAudioReadyChanged) {
        console.log('⏳ AudioDescriptionAR: Áudio ainda não está pronto, aguardando...')
      }
      return
    }

    // Se Audiodescrição está ativo
    if (audioActive) {
      // Vídeo AR está reproduzindo
      if (videoState?.isPlaying) {
        // Sincronizar com o vídeo AR apenas se houver diferença significativa
        const timeDiff = Math.abs(audio.currentTime - videoState.currentTime)
        if (timeDiff > 0.5) {
          // Só logar sincronização se for significativa
          audio.currentTime = videoState.currentTime
        }
        
        // Reproduzir áudio de Audiodescrição
        if (audio.paused) {
          // Sincronizar currentTime antes de reproduzir para continuar de onde parou
          if (videoState?.currentTime !== undefined) {
            audio.currentTime = videoState.currentTime
            console.log('⏩ Sincronizando áudio AD com vídeo:', videoState.currentTime.toFixed(2), 's')
          }
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
          // Sincronizar continuamente durante reprodução (sem logar)
          const timeDiff = Math.abs(audio.currentTime - videoState.currentTime)
          if (timeDiff > 0.5) {
            audio.currentTime = videoState.currentTime
          }
        }
      } else {
        // Vídeo AR pausado/terminou - PAUSAR áudio
        // Só logar quando realmente mudar de playing para paused
        if (isPlayingChanged && prevIsPlaying.current === true) {
          console.log('⏸️ Vídeo AR pausado - pausando áudio de Audiodescrição AR')
        }
        audio.pause()
      }
    } else {
      // Audiodescrição desativado
      // Só logar quando realmente mudar de ativo para inativo
      if (audioActiveChanged && prevAudioActive.current === true) {
        console.log('❌ Pausando áudio de Audiodescrição AR (toggle desativado)')
      }
      audio.pause()
    }
  }, [audioActive, videoState?.isPlaying, isAudioReady]) // Só depender de isPlaying, não de todo videoState

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

