import { useState, useRef, useEffect, useCallback } from 'react';
import type { Track, Playlist, PlayerState } from '../types/music';
import { parseM3U8, readTextFile, calculateTotalDuration } from '../utils/m3u8Parser';
import PlayerControls from './PlayerControls';
import PlaylistView from './PlaylistView';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

export default function MusicPlayer() {
  const { t } = useLanguage();

  const [playlist, setPlaylist] = useState<Playlist>({
    name: ' ',
    tracks: [],
    totalDuration: 0
  });

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrackIndex: 0,
    currentTime: 0,
    volume: 0.7,
    repeat: 'none',
    shuffle: false
  });

  const [audioFiles, setAudioFiles] = useState<Map<string, string>>(new Map());
  const [albumArtUrls, setAlbumArtUrls] = useState<Map<string, string>>(new Map());
  const [currentPlaylistTime, setCurrentPlaylistTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivo de audio cuando cambia el track
  useEffect(() => {
    if (audioRef.current && playlist.tracks.length > 0) {
      const currentTrack = playlist.tracks[playerState.currentTrackIndex];
      const audioUrl = audioFiles.get(currentTrack.fileName);

      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = playerState.volume;

        if (playerState.isPlaying) {
          audioRef.current.play().catch(err => {
            console.error(t('errorPlaying'), err);
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
          });
        }
      }
    }
  }, [playerState.currentTrackIndex, playerState.isPlaying, playerState.volume, audioFiles, playlist.tracks, t]);

  const handleNext = useCallback(() => {
    if (playlist.tracks.length === 0) return;

    let nextIndex: number;

    if (playerState.repeat === 'one') {
      nextIndex = playerState.currentTrackIndex;
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else if (playerState.shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.tracks.length);
    } else {
      nextIndex = playerState.currentTrackIndex + 1;
      if (nextIndex >= playlist.tracks.length) {
        if (playerState.repeat === 'all') {
          nextIndex = 0;
        } else {
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          return;
        }
      }
    }

    setPlayerState(prev => ({
      ...prev,
      currentTrackIndex: nextIndex,
      currentTime: 0
    }));
  }, [playlist.tracks.length, playerState.repeat, playerState.shuffle, playerState.currentTrackIndex]);

  // Actualizar tiempo actual
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));

      // Calcular tiempo total de la playlist
      let totalTime = 0;
      for (let i = 0; i < playerState.currentTrackIndex; i++) {
        totalTime += playlist.tracks[i]?.duration || 0;
      }
      totalTime += audio.currentTime;
      setCurrentPlaylistTime(totalTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playerState.currentTrackIndex, playlist.tracks, handleNext]);

  // Manejar la selección de carpeta
  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Buscar archivo m3u8 o m3u
    const m3u8File = fileList.find(file =>
      file.name.endsWith('.m3u8') || file.name.endsWith('.m3u')
    );

    if (!m3u8File) {
      alert(t('noM3u8Found'));
      return;
    }

    try {
      // Leer y parsear el archivo m3u8
      const content = await readTextFile(m3u8File);
      console.log('📂 Archivos en la carpeta:', fileList.map(f => `${f.name} (${f.type})`));
      const parsedTracks = parseM3U8(content, '');

      // Crear URLs para los archivos de audio y las imágenes del álbum
      const audioMap = new Map<string, string>();
      const artMap = new Map<string, string>();
      const loadedAlbumArts = new Map<string, string>(); // Cache de imágenes ya cargadas
      const tracksWithDuration: Track[] = [];

      // Primero, cargar todas las imágenes únicas
      const uniqueAlbumArts = new Set(parsedTracks.map(t => t.albumArt).filter(Boolean));

      console.log('🔍 Imágenes a buscar:', Array.from(uniqueAlbumArts));
      console.log('🖼️ Archivos de imagen en la carpeta:', fileList.filter(f =>
        f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
      ).map(f => `${f.name} (${f.type || 'sin tipo'})`));

      for (const albumArtPath of uniqueAlbumArts) {
        if (albumArtPath) {
          const albumArtFileName = albumArtPath.split('/').pop() || albumArtPath;
          console.log(`🔎 Buscando: "${albumArtFileName}"`);

          // Búsqueda más flexible
          const albumArtFile = fileList.find(file => {
            const match =
              file.name === albumArtFileName ||
              file.name.toLowerCase() === albumArtFileName.toLowerCase() ||
              // Buscar por extensión de imagen si el archivo es una imagen
              (file.type.startsWith('image/') && file.name.toLowerCase() === albumArtFileName.toLowerCase()) ||
              // Buscar archivos de imagen aunque no tengan el tipo MIME correcto
              (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) && file.name.toLowerCase() === albumArtFileName.toLowerCase());

            if (match) {
              console.log(`   ✓ Encontrado: ${file.name} (${file.type || 'sin tipo'})`);
            }
            return match;
          });

          if (albumArtFile) {
            const artUrl = URL.createObjectURL(albumArtFile);
            loadedAlbumArts.set(albumArtPath, artUrl);
            console.log(`✓ Imagen cargada exitosamente: ${albumArtFileName} → ${artUrl.substring(0, 50)}...`);
          } else {
            console.error(`✗ No se encontró la imagen: ${albumArtFileName}`);
            console.error('   Archivos disponibles:', fileList.map(f => f.name).join(', '));
          }
        }
      }

      for (const track of parsedTracks) {
        // Buscar el archivo de audio correspondiente
        const audioFile = fileList.find(file =>
          file.name === track.fileName ||
          file.name.includes(track.fileName.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, ''))
        );

        if (audioFile) {
          const url = URL.createObjectURL(audioFile);
          audioMap.set(track.fileName, url);

          // Asociar la imagen del álbum con este track si existe
          if (track.albumArt && loadedAlbumArts.has(track.albumArt)) {
            const artUrl = loadedAlbumArts.get(track.albumArt);
            if (artUrl) {
              artMap.set(track.fileName, artUrl);
              console.log(`🔗 Asociando imagen al track: "${track.fileName}" → ${artUrl.substring(0, 50)}...`);
            }
          } else if (track.albumArt) {
            console.warn(`⚠️ Track "${track.fileName}" tiene albumArt="${track.albumArt}" pero no está en loadedAlbumArts`);
          }

          // Siempre obtener la duración real del archivo de audio
          // porque las duraciones del m3u8 no son fiables
          const audio = new Audio(url);
          await new Promise<void>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              track.duration = audio.duration;
              resolve();
            });
            audio.addEventListener('error', () => {
              // Si hay error, mantener la duración del m3u8 si existe y es válida
              if (!track.duration || track.duration <= 0) {
                track.duration = 0;
              }
              resolve();
            });
          });

          tracksWithDuration.push(track);
        }
      }

      if (tracksWithDuration.length === 0) {
        alert(t('noAudioFilesFound'));
        return;
      }

      setAudioFiles(audioMap);
      setAlbumArtUrls(artMap);

      console.log('📊 Resumen de carga:');
      console.log(`   - Tracks cargados: ${tracksWithDuration.length}`);
      console.log(`   - Audio URLs: ${audioMap.size}`);
      console.log(`   - Album Art URLs: ${artMap.size}`);
      console.log('   - Mapeo de imágenes:', Array.from(artMap.entries()).map(([k, v]) => `"${k}" → ${v.substring(0, 40)}...`));

      const totalDuration = calculateTotalDuration(tracksWithDuration);
      setPlaylist({
        name: m3u8File.name.replace(/\.(m3u8|m3u)$/i, ''),
        tracks: tracksWithDuration,
        totalDuration
      });

      setPlayerState(prev => ({ ...prev, currentTrackIndex: 0, currentTime: 0 }));
      setCurrentPlaylistTime(0);

    } catch (error) {
      console.error('Error al cargar la playlist:', error);
      alert(t('errorLoadingPlaylist'));
    }
  };

  const handlePlay = () => {
    if (audioRef.current && playlist.tracks.length > 0) {
      audioRef.current.play();
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  };


  const handlePrevious = () => {
    if (playlist.tracks.length === 0) return;

    // Si estamos a más de 3 segundos, reiniciar la canción actual
    if (playerState.currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    let prevIndex: number;

    if (playerState.shuffle) {
      prevIndex = Math.floor(Math.random() * playlist.tracks.length);
    } else {
      prevIndex = playerState.currentTrackIndex - 1;
      if (prevIndex < 0) {
        if (playerState.repeat === 'all') {
          prevIndex = playlist.tracks.length - 1;
        } else {
          prevIndex = 0;
        }
      }
    }

    setPlayerState(prev => ({
      ...prev,
      currentTrackIndex: prevIndex,
      currentTime: 0
    }));
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setPlayerState(prev => ({ ...prev, volume }));
  };

  const handleRepeatChange = () => {
    setPlayerState(prev => {
      const repeatModes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
      const currentIndex = repeatModes.indexOf(prev.repeat);
      const nextIndex = (currentIndex + 1) % repeatModes.length;
      return { ...prev, repeat: repeatModes[nextIndex] };
    });
  };

  const handleShuffleChange = () => {
    setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }));
  };

  const handleTrackSelect = (index: number) => {
    setPlayerState(prev => ({
      ...prev,
      currentTrackIndex: index,
      currentTime: 0,
      isPlaying: true
    }));
  };

  const currentTrack = playlist.tracks[playerState.currentTrackIndex] || null;
  const currentAlbumArt = currentTrack ? albumArtUrls.get(currentTrack.fileName) : null;

  console.log('🎨 Render - Track actual:', currentTrack?.title);
  console.log('   - fileName:', currentTrack?.fileName);
  console.log('   - albumArt en track:', currentTrack?.albumArt);
  console.log('   - Album Art URLs disponibles:', Array.from(albumArtUrls.keys()));
  console.log('   - Album Art URL encontrada:', currentAlbumArt || 'NINGUNA');

  return (
    <>
      {/* Fondo con imagen del álbum */}
      {currentAlbumArt && (
        <div
          key={currentAlbumArt}
          className="fixed inset-0 z-0 transition-all duration-1000 ease-in-out animate-[fadeIn_1s_ease-out]"
          style={{
            backgroundImage: `url(${currentAlbumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Overlay para oscurecer y dar efecto blur */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl" />
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-6 sm:p-12 gap-6 pb-64 animate-[fadeIn_0.6s_ease-out] relative z-10">
      {/* Header con botón para cargar playlist */}
      <div className="flex justify-between items-center gap-8 mb-2">
        <h1 className="flex items-center gap-3 text-4xl font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] m-0">
          <svg viewBox="0 0 24 24" fill="url(#musicGradient)" className="w-11 h-11" aria-hidden="true">
            <title>{t('music')}</title>
            <defs>
              <linearGradient id="musicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f9b69d" />
                <stop offset="100%" stopColor="#ff9999" />
              </linearGradient>
            </defs>
            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
          </svg>
          {t('music')}
        </h1>

        <div className="flex items-center gap-4">
          <LanguageSelector />

          <button
            type="button"
            className="flex items-center gap-2.5 px-7 py-3.5 bg-white/70 backdrop-blur-xl text-[#f9b69d] border border-[#fce5e8]/40 rounded-full font-medium cursor-pointer transition-all hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(249,182,157,0.2)] hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
              <title>{t('folder')}</title>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            {t('selectFolder')}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          /* @ts-expect-error webkitdirectory is not in the official types */
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Vista de la playlist */}
        <PlaylistView
          tracks={playlist.tracks}
          currentTrackIndex={playerState.currentTrackIndex}
          onTrackSelect={handleTrackSelect}
          playlistName={playlist.name}
          totalDuration={playlist.totalDuration}
          currentPlaylistTime={currentPlaylistTime}
        />
      </div>

      {/* Controles del reproductor - flotante */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={playerState.isPlaying}
        currentTime={playerState.currentTime}
        volume={playerState.volume}
        repeat={playerState.repeat}
        shuffle={playerState.shuffle}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onRepeatChange={handleRepeatChange}
        onShuffleChange={handleShuffleChange}
        audioRef={audioRef}
      />
      </div>
    </>
  );
}

