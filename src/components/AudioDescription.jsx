import React, { useState, useRef, useEffect } from 'react'

const AudioDescription = ({ audioActive, videoState }) => {
  const audioRef = useRef(null)
  const [isAudioReady, setIsAudioReady] = useState(false)

  // Carregar e preparar o áudio quando o componente montar
  useEffect(() => {
    console.log('🎧 AudioDescription: Componente montado')
    const audio = audioRef.current
    
    if (!audio) {
      console.log('❌ AudioDescription: audioRef.current é null no mount')
      return
    }

    console.log('✅ AudioDescription: audioRef disponível, iniciando carregamento')

    const handleCanPlay = () => {
      console.log('✅ Áudio de Audiodescrição pronto para reproduzir')
      setIsAudioReady(true)
    }

    const handleLoadedData = () => {
      console.log('✅ Áudio de Audiodescrição - dados carregados')
      setIsAudioReady(true)
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadeddata', handleLoadedData)
    
    console.log('⏳ Forçando carregamento do áudio de Audiodescrição...')
    audio.load() // Forçar carregamento

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      console.log('❌ AudioDescription: Áudio ref não disponível')
      return
    }

    console.log('🎧 AudioDescription - audioActive:', audioActive, 'videoState:', videoState, 'isAudioReady:', isAudioReady)

    if (!isAudioReady) {
      console.log('⏳ AudioDescription: Áudio ainda não está pronto, aguardando...')
      return
    }

    // Se Audiodescrição está ativo
    if (audioActive) {
      // Vídeo principal está reproduzindo
      if (videoState?.isPlaying) {
        console.log('✅ Reproduzindo áudio de Audiodescrição - videoState.currentTime:', videoState.currentTime)
        
        // Sincronizar com o vídeo principal apenas se houver diferença significativa
        const timeDiff = Math.abs(audio.currentTime - videoState.currentTime)
        if (timeDiff > 0.5) {
          console.log('🔄 Sincronizando Audiodescrição - diff:', timeDiff.toFixed(2), 's')
          audio.currentTime = videoState.currentTime
        }
        
        // Reproduzir áudio de Audiodescrição
        if (audio.paused) {
          console.log('▶️ Reproduzindo áudio de Audiodescrição')
          audio.play()
            .then(() => console.log('✅ Áudio de Audiodescrição reproduzindo'))
            .catch(e => console.log('❌ Erro ao reproduzir áudio de audiodescrição:', e))
        }
      } else {
        // Vídeo principal pausado/terminou - PAUSAR áudio
        console.log('⏸️ Vídeo principal pausado - pausando áudio de Audiodescrição')
        audio.pause()
      }
    } else {
      // Audiodescrição desativado
      console.log('❌ Pausando áudio de Audiodescrição (toggle desativado)')
      audio.pause()
    }
  }, [audioActive, videoState, isAudioReady])

  return (
    <audio 
      ref={audioRef}
      className="audio-description"
      loop={false}
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src="/ayamioja-ra/videos/ad_anim_1.m4a" type="audio/mp4" />
      <source src="/ayamioja-ra/videos/ad_anim_1.m4a" type="audio/mpeg" />
    </audio>
  )
}

export default AudioDescription

