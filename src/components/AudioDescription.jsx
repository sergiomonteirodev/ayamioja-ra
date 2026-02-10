import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

const AudioDescription = forwardRef(({ audioActive, videoState, playAdStandalone, onADEnded }, ref) => {
  const audioRef = useRef(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  
  const base = import.meta.env.BASE_URL || '/'

  // iOS: play() deve ser chamado dentro do gesto do usuário. Expor para o pai chamar no toggle.
  useImperativeHandle(ref, () => ({
    playAD: () => {
      const audio = audioRef.current
      if (!audio) return
      audio.volume = 0.8
      audio.currentTime = 0
      audio.play().catch(() => {})
    }
  }), [])

  // Carregar e preparar o áudio quando o componente montar
  useEffect(() => {
    console.log('🎧 AudioDescription: Componente montado')
    const audio = audioRef.current
    
    if (!audio) {
      console.log('❌ AudioDescription: audioRef.current é null no mount')
      return
    }

    audio.volume = 0.8

    const handleCanPlay = () => {
      setIsAudioReady(true)
      audio.volume = 0.8
    }

    const handleLoadedData = () => {
      setIsAudioReady(true)
      audio.volume = 0.8
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.load()

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  // Modo sincronizado: pause → AD → resume. Só toca AD quando playAdStandalone.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioReady) return

    if (!audioActive) {
      audio.pause()
      return
    }

    if (playAdStandalone) {
      audio.volume = 0.8
      audio.currentTime = 0

      const handleEnded = () => {
        audio.removeEventListener('ended', handleEnded)
        onADEnded?.()
      }
      audio.addEventListener('ended', handleEnded)

      if (audio.paused) {
        audio.play().catch((e) => console.warn('Erro ao reproduzir AD:', e))
      }

      return () => audio.removeEventListener('ended', handleEnded)
    }

    audio.pause()
  }, [audioActive, playAdStandalone, isAudioReady, onADEnded])

  return (
    <audio 
      ref={audioRef}
      className="audio-description"
      loop={false}
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src={`${base}videos/ad_anim_1.m4a`} type="audio/mp4" />
      <source src={`${base}videos/ad_anim_1.m4a`} type="audio/mpeg" />
    </audio>
  )
})

AudioDescription.displayName = 'AudioDescription'

export default AudioDescription

