import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ToggleControls from '../components/ToggleControls'
import MainVideo from '../components/MainVideo'
import InterpreterVideo from '../components/InterpreterVideo'
import AudioDescription from '../components/AudioDescription'
import ActionButtons from '../components/ActionButtons'

/** Momento (s) em que a bonequinha surge – mesmo parâmetro da home (AD desativado nesta página). */
const BONEQUINHA_TIME_SEC = 1.82

const OuvirLivroPage = () => {
  const [librasActive, setLibrasActive] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [videoState, setVideoState] = useState(null)
  const [adPhase, setAdPhase] = useState('none')
  const [resumeVideoAt, setResumeVideoAt] = useState(null)
  const [resumeTrigger, setResumeTrigger] = useState(null)
  const [mainVideoEnded, setMainVideoEnded] = useState(false)
  const [librasVideoEnded, setLibrasVideoEnded] = useState(false)
  const location = useLocation()

  const canShowReplay = mainVideoEnded && (!librasActive || librasVideoEnded)

  const onPauseForAD = useCallback((resumeAt) => {
    setResumeVideoAt(resumeAt)
    setAdPhase('playing_ad')
  }, [])

  const onADEnded = useCallback(() => {
    setAdPhase('none')
    setResumeTrigger(Date.now())
  }, [])

  const onResumed = useCallback(() => {
    setResumeVideoAt(null)
    setResumeTrigger(null)
  }, [])

  const onVideoReset = useCallback(() => {
    setAdPhase('none')
    setResumeVideoAt(null)
    setResumeTrigger(null)
    setMainVideoEnded(false)
    setLibrasVideoEnded(false)
  }, [])

  const onVideoEnded = useCallback(() => {
    setMainVideoEnded(true)
  }, [])

  const onLibrasEnded = useCallback(() => {
    setLibrasVideoEnded(true)
  }, [])

  const handleLibrasToggle = (active) => {
    setLibrasActive(active)
    console.log('Toggle Libras (Ouvir Livro):', active)
  }

  const handleAudioToggle = (active) => {
    setAudioActive(active)
    console.log('Toggle Audio (Ouvir Livro):', active)
  }

  const handleVideoStateChange = (state) => {
    setVideoState(state)
  }

  // Forçar carregamento do vídeo ao montar (mesmo padrão da Home)
  useEffect(() => {
    const forceVideoLoad = () => {
      const video = document.getElementById('main-video')
      if (video) {
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', 'true')
        video.playsInline = true
        if (video.readyState === 0) {
          video.load()
        }
      }
    }
    forceVideoLoad()
    const timer = setTimeout(forceVideoLoad, 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const base = import.meta.env.BASE_URL || '/'
  const videoSrc = `${base}videos/ouvir_livro.mp4`
  /** Vídeo de Libras da página Ouvir o livro – arquivo: public/videos/libras_ouvir_livro.mp4 */
  const librasVideoSrc = `${base}videos/libras_ouvir_livro.mp4`
  /** Legenda .vtt do vídeo principal – arquivo: public/videos/legenda.vtt */
  const trackSrc = `${base}videos/legenda.vtt`

  return (
    <div>
      <Navigation />

      <ToggleControls
        onLibrasToggle={handleLibrasToggle}
        onAudioToggle={handleAudioToggle}
        showLogo={false}
        audioDisabled={true}
      />

      <main className="main-content">
        <MainVideo
          librasActive={librasActive}
          audioActive={audioActive}
          onVideoStateChange={handleVideoStateChange}
          bonequinhaTime={BONEQUINHA_TIME_SEC}
          onPauseForAD={onPauseForAD}
          resumeFrom={resumeVideoAt}
          resumeTrigger={resumeTrigger}
          onResumed={onResumed}
          onVideoReset={onVideoReset}
          onVideoEnded={onVideoEnded}
          adPhase={adPhase}
          videoSrc={videoSrc}
          storageKey="ouvirLivroVideoStarted"
          resetWhenPathname="/ouvir-livro"
          canShowReplay={canShowReplay}
          trackSrc={trackSrc}
          trackLang="pt-BR"
          trackLabel="Português"
          captionOutside={true}
          showPauseOnInteract={true}
        />

        <ActionButtons showAccessButton={true} activeButton="ouvir-livro" />
      </main>

      <InterpreterVideo
        key="ouvir-livro-libras"
        librasActive={librasActive}
        videoState={videoState}
        adPhase={adPhase}
        audioActive={audioActive}
        customVideoSrc={librasVideoSrc}
        mainVideoEnded={mainVideoEnded}
        onLibrasEnded={onLibrasEnded}
      />

      <AudioDescription
        audioActive={audioActive}
        videoState={videoState}
        playAdStandalone={adPhase === 'playing_ad'}
        onADEnded={onADEnded}
      />

      <footer>Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados</footer>
    </div>
  )
}

export default OuvirLivroPage
