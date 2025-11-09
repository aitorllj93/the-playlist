import type { Track } from '../types/music';
import { formatTime } from '../utils/m3u8Parser';
import { useLanguage } from '../i18n/LanguageContext';

interface PlaylistViewProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  playlistName: string;
  totalDuration: number;
  currentPlaylistTime: number;
}

export default function PlaylistView({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  playlistName,
  totalDuration,
  currentPlaylistTime
}: PlaylistViewProps) {
  const { t } = useLanguage();
  const totalProgress = totalDuration > 0 ? (currentPlaylistTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(249,182,157,0.2)] border border-white/80 flex flex-col gap-8 flex-1 min-h-0">
      {/* Header de la playlist - solo cuando hay tracks */}
      {tracks.length > 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] m-0 mb-2">{playlistName}</h2>
            <p className="text-[#d4725c] text-base sm:text-lg font-normal m-0">
              {tracks.length} {tracks.length === 1 ? t('track') : t('tracks')} • {formatTime(totalDuration)}
            </p>
          </div>

          {/* Progreso total de la playlist */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-[#b85e4f] font-medium tracking-wide">
              <span>{t('totalProgress')}</span>
              <span>{formatTime(currentPlaylistTime)} / {formatTime(totalDuration)}</span>
            </div>
            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-linear-to-r from-[#f9b69d] via-[#fec5b2] to-[#ff9999] transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(249,182,157,0.4)]"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de tracks */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-8 py-16 px-8 text-[#8a4a3e] max-w-2xl mx-auto">
            <div className="text-center space-y-6">
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
          </div>
        ) : (
          <>
            {tracks.map((track, index) => (
            <button
              type="button"
              key={track.id}
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl cursor-pointer transition-all text-left w-full group ${
                index === currentTrackIndex
                  ? 'bg-linear-to-r from-[#fce5e8]/60 to-[#fef0e8]/60 shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              onClick={() => onTrackSelect(index)}
            >
              <div className="w-8 flex items-center justify-center text-[#b85e4f] font-medium text-sm">
                {index === currentTrackIndex ? (
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_infinite]" />
                    <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_0.2s_infinite]" />
                    <span className="w-0.5 bg-linear-to-t from-[#f9b69d] to-[#ff9999] rounded-full animate-[playing_0.8s_ease-in-out_0.4s_infinite]" />
                  </div>
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
            </button>
            ))}
            {/* Espaciador para evitar que el reproductor tape las últimas canciones */}
            <div className="h-64" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}

