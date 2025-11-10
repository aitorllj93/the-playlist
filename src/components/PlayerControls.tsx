import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Track } from '../types/music';
import { formatTime } from '../utils/m3u8Parser';
import { useLanguage } from '../i18n/LanguageContext';

interface PlayerControlsProps {
  currentTrack: Track | null;
  currentAlbumArt?: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  repeat: 'none' | 'all' | 'one';
  shuffle: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onRepeatChange: () => void;
  onShuffleChange: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function PlayerControls({
  currentTrack,
  currentAlbumArt,
  isPlaying,
  currentTime,
  volume,
  repeat,
  shuffle,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onRepeatChange,
  onShuffleChange,
  audioRef
}: PlayerControlsProps) {
  const { t } = useLanguage();
  const progressRef = useRef<HTMLDivElement>(null);
  const particleIds = ['particle-1', 'particle-2', 'particle-3'];
  const [buttonIcon, setButtonIcon] = useState<'play' | 'vinyl' | 'vinyl-spinning' | 'pause'>('play');
  const previousIsPlayingRef = useRef(false);

  // Detectar cuando se inicia la reproducción para mostrar animación de vinilo
  useEffect(() => {
    let spinTimer: ReturnType<typeof setTimeout> | null = null;
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;

    // Si cambió de false a true (se inició la reproducción)
    if (!previousIsPlayingRef.current && isPlaying) {
      console.log('🎵 Iniciando animación de vinilo');
      // Secuencia: play → vinyl → vinyl-spinning → pause
      setButtonIcon('vinyl');

      // Después de 300ms, empezar a girar
      spinTimer = setTimeout(() => {
        console.log('🔄 Vinilo girando');
        setButtonIcon('vinyl-spinning');
      }, 300);

      // Después de 2 segundos de girar, cambiar a pause
      pauseTimer = setTimeout(() => {
        console.log('⏸️ Cambiando a pausa');
        setButtonIcon('pause');
      }, 2300); // 300ms transición + 2000ms girando
    }

    // Si cambió de true a false (se pausó)
    if (previousIsPlayingRef.current && !isPlaying) {
      console.log('▶️ Pausado - volviendo a play');
      setButtonIcon('play');
    }

    // Actualizar el valor anterior
    previousIsPlayingRef.current = isPlaying;

    // Cleanup function
    return () => {
      if (spinTimer) {
        clearTimeout(spinTimer);
      }
      if (pauseTimer) {
        clearTimeout(pauseTimer);
      }
    };
  }, [isPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    // Usar la duración real del audio en lugar de la del track
    const duration = audioRef.current.duration || currentTrack?.duration || 0;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  // Usar la duración real del elemento audio si está disponible
  const actualDuration = audioRef.current?.duration || currentTrack?.duration || 0;
  const progressPercentage = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-3xl border-t border-white/80 shadow-[0_-10px_40px_rgba(249,182,157,0.25)]"
    >
      <div className="flex gap-4 items-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-5">
        {/* Cover de la canción en el lado izquierdo */}
        <div className="shrink-0 hidden sm:block">
          <AnimatePresence mode="wait">
            {currentAlbumArt ? (
              <motion.div
                key={currentAlbumArt}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-36 h-36 rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(249,182,157,0.3)] ring-2 ring-white/50"
              >
                <img
                  src={currentAlbumArt}
                  alt={currentTrack?.title || 'Album cover'}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-28 h-28 rounded-lg bg-linear-to-br from-[#f9b69d] to-[#ff9999] flex items-center justify-center shadow-[0_8px_30px_rgba(249,182,157,0.3)] ring-2 ring-white/50"
              >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-14 h-14 text-white/60"
                aria-label="Music note"
              >
                <title>Music note</title>
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Contenedor de controles y progreso */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Información del track actual */}
          <div className="text-left min-h-10">
            <AnimatePresence mode="wait">
              {currentTrack ? (
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="text-xl font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] mb-0.5 truncate">{currentTrack.title}</div>
                  {currentTrack.artist && <div className="text-sm text-[#d4725c] font-normal truncate">{currentTrack.artist}</div>}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm text-[#d4725c]/60 py-2 font-light"
                >
                  {t('noTrackSelected')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

      {/* Barra de progreso */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs text-[#b85e4f] font-medium tracking-wide min-w-10 text-right">{formatTime(currentTime)}</span>
        <div className="flex-1 relative">
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/40 rounded-full cursor-pointer backdrop-blur-sm relative group"
            onClick={handleProgressClick}
            onKeyDown={(e) => e.key === 'Enter' && handleProgressClick(e as unknown as React.MouseEvent<HTMLDivElement>)}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={actualDuration}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            <div
              className={`h-full bg-linear-to-r from-[#f9b69d] via-[#fec5b2] to-[#ff9999] transition-all duration-150 rounded-full relative overflow-hidden ${
                isPlaying ? 'animate-[glow-pulse_2s_ease-in-out_infinite]' : 'filter-[drop-shadow(0_0_4px_rgba(249,182,157,0.5))]'
              }`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Efecto de brillo animado cuando está reproduciéndose */}
              {isPlaying && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
              )}
            </div>
            {/* Partículas flotantes animadas */}
            {isPlaying && progressPercentage > 10 && (
              particleIds.map((id, i) => (
                <div
                  key={id}
                  className="absolute w-1 h-1 bg-white/60 rounded-full pointer-events-none"
                  style={{
                    left: `${Math.min(progressPercentage - 10, Math.random() * (progressPercentage - 10))}%`,
                    animationName: 'float-particle',
                    animationDuration: `${2 + i * 0.5}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDelay: `${i * 0.3}s`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              ))
            )}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercentage}% - 6px)` }}
            />
          </div>
        </div>
        <span className="text-xs text-[#b85e4f] font-medium tracking-wide min-w-10">
          {formatTime(actualDuration)}
        </span>
      </div>

      {/* Controles principales */}
      <div className="flex justify-center items-center gap-2 sm:gap-3">
        <button
          type="button"
          className={`bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-all ${
            shuffle ? 'text-[#d4725c] bg-white/60' : 'text-[#b85e4f]/70'
          } hover:bg-white/60 hover:text-[#d4725c] hover:scale-105 active:scale-95`}
          onClick={onShuffleChange}
          title={t('shuffle')}
          aria-label={t('shuffle')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
            <title>{t('shuffle')}</title>
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </button>

        <button
          type="button"
          className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-all text-[#b85e4f]/70 hover:bg-white/60 hover:text-[#d4725c] hover:scale-105 active:scale-95"
          onClick={onPrevious}
          title={t('previous')}
          aria-label={t('previous')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <title>{t('previous')}</title>
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        <button
          type="button"
          className={`bg-linear-to-br from-[#f9b69d] via-[#fec5b2] to-[#ff9999] text-white p-3 border-none cursor-pointer rounded-full flex items-center justify-center transition-all hover:shadow-[0_8px_25px_rgba(249,182,157,0.4)] hover:scale-105 active:scale-95 ${
            buttonIcon === 'vinyl-spinning' ? 'animate-[vinyl-spin_0.8s_linear_infinite]' : ''
          }`}
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? t('pause') : t('play')}
          aria-label={isPlaying ? t('pause') : t('play')}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {buttonIcon === 'play' && (
                <motion.svg
                  key="play"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 ml-0.5 absolute inset-0"
                  aria-hidden="true"
                >
                  <title>{t('play')}</title>
                  <path d="M8 5v14l11-7z"/>
                </motion.svg>
              )}

              {(buttonIcon === 'vinyl' || buttonIcon === 'vinyl-spinning') && (
                <motion.svg
                  key="vinyl"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 absolute inset-0"
                  aria-hidden="true"
                >
                  <title>Vinyl</title>
                  {/* Disco exterior */}
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
                  {/* Círculo central (etiqueta del disco) */}
                  <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.4"/>
                  {/* Agujero central */}
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="1"/>
                  {/* Líneas del vinilo (surcos) */}
                  <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3"/>
                  <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3"/>
                </motion.svg>
              )}

              {buttonIcon === 'pause' && (
                <motion.svg
                  key="pause"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 absolute inset-0"
                  aria-hidden="true"
                >
                  <title>{t('pause')}</title>
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </button>

        <button
          type="button"
          className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-all text-[#b85e4f]/70 hover:bg-white/60 hover:text-[#d4725c] hover:scale-105 active:scale-95"
          onClick={onNext}
          title={t('next')}
          aria-label={t('next')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <title>{t('next')}</title>
            <path d="M6 6l8.5 6-8.5 6V6zm10.5 0h2v12h-2z"/>
          </svg>
        </button>

        <button
          type="button"
          className={`bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-all ${
            repeat !== 'none' ? 'text-[#d4725c] bg-white/60' : 'text-[#b85e4f]/70'
          } hover:bg-white/60 hover:text-[#d4725c] hover:scale-105 active:scale-95`}
          onClick={onRepeatChange}
          title={t('repeat')}
          aria-label={t('repeat')}
        >
          {repeat === 'one' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <title>{t('repeatOne')}</title>
              <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>
              <text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle">1</text>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <title>{t('repeat')}</title>
              <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Control de volumen */}
      <div className="flex items-center gap-3 justify-center">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#b85e4f]" aria-hidden="true">
          <title>{t('volume')}</title>
          {volume === 0 ? (
            <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
          ) : volume < 0.5 ? (
            <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
          ) : (
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          )}
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(Number.parseFloat(e.target.value))}
          aria-label={t('volumeControl')}
          className="w-24 h-1 appearance-none bg-[#f9b69d]/40 rounded-full outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-linear-to-br [&::-webkit-slider-thumb]:from-[#f9b69d] [&::-webkit-slider-thumb]:to-[#ff9999] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-linear-to-br [&::-moz-range-thumb]:from-[#f9b69d] [&::-moz-range-thumb]:to-[#ff9999] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

        </div>
      </div>

      {/* Audio element oculto */}
      <audio ref={audioRef}>
        <track kind="captions" />
      </audio>
    </motion.div>
  );
}

