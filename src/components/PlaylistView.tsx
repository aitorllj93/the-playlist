import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Track } from '../types/music';
import { formatTime } from '../utils/m3u8Parser';
import { useLanguage } from '../i18n/LanguageContext';
import ilustration from '../assets/ilustration.png';

interface PlaylistViewProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  playlistName: string;
  totalDuration: number;
  currentPlaylistTime: number;
  isPlaying: boolean;
}

export default function PlaylistView({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  playlistName,
  totalDuration,
  currentPlaylistTime,
  isPlaying
}: PlaylistViewProps) {
  const { t } = useLanguage();
  const totalProgress = totalDuration > 0 ? (currentPlaylistTime / totalDuration) * 100 : 0;
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const trackRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // No cambiar estado durante transición
      if (isTransitioningRef.current) return;

      // Cancelar frame anterior si existe
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Usar requestAnimationFrame para suavizar
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;

        // Umbral claro con histéresis grande
        const shouldBeScrolled = scrollTop > 100;
        const shouldBeExpanded = scrollTop < 20;

        if (shouldBeScrolled && !isScrolled) {
          isTransitioningRef.current = true;
          setIsScrolled(true);
          // Dar tiempo a la transición CSS (300ms)
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 350);
        } else if (shouldBeExpanded && isScrolled) {
          isTransitioningRef.current = true;
          setIsScrolled(false);
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 350);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isScrolled]);

  // Hacer scroll a la canción actual cuando cambia
  useEffect(() => {
    const currentTrackElement = trackRefs.current.get(currentTrackIndex);
    if (currentTrackElement && containerRef.current) {
      currentTrackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTrackIndex]);

  return (
    <div
      ref={containerRef}
      className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(249,182,157,0.2)] border border-white/80 flex flex-col flex-1 min-h-0 overflow-y-auto"
    >
      {/* Header de la playlist - solo cuando hay tracks */}
      {tracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`sticky top-0 z-10 bg-white/95 backdrop-blur-2xl border-b border-[#f9b69d]/10 rounded-t-3xl transition-all duration-300 ${
          isScrolled
            ? 'px-8 sm:px-10 py-4'
            : 'px-8 sm:px-10 pt-8 sm:pt-10 pb-6'
        }`}>
          <div className={`flex flex-col transition-all duration-300 ${isScrolled ? 'gap-3' : 'gap-6'}`}>
            <div className={`flex transition-all duration-300 ${isScrolled ? 'flex-row items-center justify-between gap-4' : 'flex-col'}`}>
              <h2 className={`font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] m-0 transition-all duration-300 ${
                isScrolled
                  ? 'text-xl sm:text-2xl'
                  : 'text-3xl sm:text-4xl mb-2'
              }`}>
                {playlistName}
              </h2>
              <p className={`text-[#d4725c] font-normal m-0 whitespace-nowrap transition-all duration-300 ${
                isScrolled
                  ? 'text-sm sm:text-base'
                  : 'text-base sm:text-lg'
              }`}>
                {tracks.length} {tracks.length === 1 ? t('track') : t('tracks')} • {formatTime(totalDuration)}
              </p>
            </div>

            {/* Progreso total de la playlist */}
            <div className="flex flex-col gap-3">
              {/* Textos de progreso - solo cuando no está scrolled */}
              {!isScrolled && (
                <div className="flex justify-between text-sm text-[#b85e4f] font-medium tracking-wide animate-[fadeIn_0.3s_ease-out]">
                  <span>{t('totalProgress')}</span>
                  <span>{formatTime(currentPlaylistTime)} / {formatTime(totalDuration)}</span>
                </div>
              )}

              {/* Barra de progreso - siempre visible */}
              <div className={`bg-white/50 rounded-full overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                isScrolled ? 'h-1' : 'h-1.5'
              }`}>
                <div
                  className="h-full bg-linear-to-r from-[#f9b69d] via-[#fec5b2] to-[#ff9999] transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(249,182,157,0.4)]"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de tracks */}
      <div className={`flex flex-col ${tracks.length === 0 ? 'flex-1 justify-center p-8 sm:p-10' : 'gap-1.5 px-8 sm:px-10 py-6'}`}>
        {tracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center gap-8 py-16 px-8 text-[#8a4a3e] max-w-2xl mx-auto"
          >
            <div className="text-center space-y-6">
              <motion.img
                src={ilustration}
                alt="Music illustration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-64 h-64 mx-auto mb-4"
              />
              <h2 className="text-3xl font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] m-0">
                {t('emptyStateTitle')}
              </h2>

              <div className="space-y-4 text-[#8a4a3e]/80 text-base leading-relaxed">
                <p className="m-0">
                  {t('emptyStateDescription1')}<strong className="font-medium text-[#d4725c]">{t('emptyStateDescription1Bold')}</strong>.
                </p>

                <p className="m-0">
                  {t('emptyStateDescription2')}
                </p>

                <p className="m-0 italic text-[#8a4a3e]/70">
                  {t('emptyStateDescription3')}
                  <br />
                  {t('emptyStateDescription3Line2')}
                </p>
              </div>

              <div className="pt-6 border-t border-[#f9b69d]/20 mt-8">
                <p className="m-0 text-lg font-medium text-[#d4725c] mb-2">
                  {t('emptyStateCallToAction')}
                </p>
                <p className="m-0 text-sm text-[#8a4a3e]/60 font-light">
                  {t('emptyStateSubtitle')}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {tracks.map((track, index) => (
            <motion.button
              type="button"
              key={track.id}
              ref={(el) => {
                if (el) {
                  trackRefs.current.set(index, el);
                } else {
                  trackRefs.current.delete(index);
                }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl cursor-pointer transition-all text-left w-full group ${
                index === currentTrackIndex
                  ? 'bg-linear-to-r from-[#fce5e8]/60 to-[#fef0e8]/60 shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              onClick={() => onTrackSelect(index)}
            >
              <div className="w-8 flex items-center justify-center text-[#b85e4f] font-medium text-sm">
                {index === currentTrackIndex ? (
                  isPlaying ? (
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_infinite]" />
                      <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_0.2s_infinite]" />
                      <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_0.4s_infinite]" />
                    </div>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#d4725c]" aria-hidden="true">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                    </svg>
                  )
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`font-normal overflow-hidden text-ellipsis whitespace-nowrap transition-colors ${
                  index === currentTrackIndex
                    ? 'text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999]'
                    : 'text-[#8a4a3e] group-hover:text-[#d4725c]'
                }`}>
                  {track.title}
                </div>
                {track.artist && (
                  <div className="text-sm text-[#b85e4f] overflow-hidden text-ellipsis whitespace-nowrap mt-1 font-normal">
                    {track.artist}
                  </div>
                )}
              </div>

              <div className="text-[#b85e4f] text-sm font-medium">
                {formatTime(track.duration)}
              </div>
            </motion.button>
            ))}
            {/* Espaciador para evitar que el reproductor tape las últimas canciones */}
            <div className="h-32" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}

