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
    <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(249,182,157,0.12)] border border-white/60 flex flex-col gap-8 flex-1 overflow-hidden">
      {/* Header de la playlist */}
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

      {/* Lista de tracks */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-20 px-8 text-[#d4725c]/70 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20" aria-hidden="true">
              <title>{t('noTracks')}</title>
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 9h6M9 15h6"/>
            </svg>
            <p className="m-0 text-lg font-normal">{t('noTracksInPlaylist')}</p>
            <p className="m-0 text-sm text-[#d4725c]/60 font-light">{t('selectFolderWithM3u8')}</p>
          </div>
        ) : (
          tracks.map((track, index) => (
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
          ))
        )}
      </div>
    </div>
  );
}

