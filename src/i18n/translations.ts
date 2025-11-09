export const translations = {
  en: {
    // Main header
    music: 'Music',
    selectFolder: 'Select Folder',

    // Alerts and messages
    noM3u8Found: 'No m3u8 or m3u file found in the selected folder',
    noAudioFilesFound: 'No audio files corresponding to the m3u8 tracks were found',
    errorLoadingPlaylist: 'Error loading playlist. Please check the m3u8 file format.',
    errorPlaying: 'Error playing:',
    noTrackSelected: 'No track selected',

    // Playlist
    track: 'track',
    tracks: 'tracks',
    totalProgress: 'Total progress',
    noTracksInPlaylist: 'No tracks in the playlist',
    selectFolderWithM3u8: 'Select a folder with an m3u8 file',

    // Player controls
    shuffle: 'Shuffle',
    previous: 'Previous',
    pause: 'Pause',
    play: 'Play',
    next: 'Next',
    repeat: 'Repeat',
    repeatOne: 'Repeat one',
    volume: 'Volume',
    volumeControl: 'Volume control',

    // Accessibility
    folder: 'Folder',
    noTracks: 'No tracks'
  },
  es: {
    // Encabezado principal
    music: 'Música',
    selectFolder: 'Seleccionar Carpeta',

    // Alertas y mensajes
    noM3u8Found: 'No se encontró un archivo m3u8 o m3u en la carpeta seleccionada',
    noAudioFilesFound: 'No se encontraron archivos de audio correspondientes a las pistas del m3u8',
    errorLoadingPlaylist: 'Error al cargar la playlist. Verifica el formato del archivo m3u8.',
    errorPlaying: 'Error al reproducir:',
    noTrackSelected: 'No hay pista seleccionada',

    // Playlist
    track: 'pista',
    tracks: 'pistas',
    totalProgress: 'Progreso total',
    noTracksInPlaylist: 'No hay pistas en la playlist',
    selectFolderWithM3u8: 'Selecciona una carpeta con un archivo m3u8',

    // Controles del reproductor
    shuffle: 'Aleatorio',
    previous: 'Anterior',
    pause: 'Pausar',
    play: 'Reproducir',
    next: 'Siguiente',
    repeat: 'Repetir',
    repeatOne: 'Repetir una',
    volume: 'Volumen',
    volumeControl: 'Control de volumen',

    // Accesibilidad
    folder: 'Carpeta',
    noTracks: 'Sin pistas'
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

