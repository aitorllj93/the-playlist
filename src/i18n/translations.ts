export const translations = {
  en: {
    // Main header
    music: 'The Playlist',
    selectFolder: 'Select Folder',

    // Alerts and messages
    noM3u8Found: 'No m3u8 or m3u file found in the selected folder',
    noAudioFilesFound: 'No audio files corresponding to the m3u8 tracks were found',
    errorLoadingPlaylist: 'Error loading playlist. Please check the m3u8 file format.',
    errorPlaying: 'Error playing:',
    noTrackSelected: 'No track selected',
    loadingPlaylist: 'Loading playlist...',

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
    noTracks: 'No tracks',
    clickHere: 'Start here!',

    // Empty state
    emptyStateTitle: 'See the full picture',
    emptyStateDescription1: 'Play your M3U8 playlists and discover something other players forgot: ',
    emptyStateDescription1Bold: 'knowing how much is left',
    emptyStateDescription2: 'A simple progress bar. Clear. For your entire playlist.',
    emptyStateDescription3: 'Because sometimes, what you need isn\'t more features.',
    emptyStateDescription3Line2: 'It\'s the right feature.',
    emptyStateCallToAction: 'Load your playlist. Play. Breathe.',
    emptyStateSubtitle: 'Simple as it should be.',

    // Saved playlists
    savedPlaylists: 'Saved Playlists',
    playlists: 'Playlists',
    noSavedPlaylists: 'No saved playlists',
    loadPlaylistToSave: 'Load a playlist to save it automatically',
    confirmDeletePlaylist: 'Delete this playlist?',
    errorDeletingPlaylist: 'Error deleting playlist',
    active: 'Active',
    delete: 'Delete',
    close: 'Close'
  },
  es: {
    // Encabezado principal
    music: 'La Lista',
    selectFolder: 'Seleccionar Carpeta',

    // Alertas y mensajes
    noM3u8Found: 'No se encontró un archivo m3u8 o m3u en la carpeta seleccionada',
    noAudioFilesFound: 'No se encontraron archivos de audio correspondientes a las pistas del m3u8',
    errorLoadingPlaylist: 'Error al cargar la lista. Verifica el formato del archivo m3u8.',
    errorPlaying: 'Error al reproducir:',
    noTrackSelected: 'No hay pista seleccionada',
    loadingPlaylist: 'Cargando lista...',

    // Playlist
    track: 'pista',
    tracks: 'pistas',
    totalProgress: 'Progreso total',
    noTracksInPlaylist: 'No hay pistas en la lista',
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
    noTracks: 'Sin pistas',
    clickHere: '¡Empieza aquí!',

    // Estado vacío
    emptyStateTitle: 'Ve el panorama completo',
    emptyStateDescription1: 'Reproduce tus listas M3U8 y descubre algo que otros reproductores olvidaron: ',
    emptyStateDescription1Bold: 'saber cuánto falta',
    emptyStateDescription2: 'Una barra de progreso simple. Clara. Para toda tu playlist.',
    emptyStateDescription3: 'Porque a veces, lo que necesitas no es más funciones.',
    emptyStateDescription3Line2: 'Es la función correcta.',
    emptyStateCallToAction: 'Carga tu lista. Reproduce. Respira.',
    emptyStateSubtitle: 'Simple como debería ser.',

    // Playlists guardadas
    savedPlaylists: 'Listas Guardadas',
    playlists: 'Listas',
    noSavedPlaylists: 'No hay listas guardadas',
    loadPlaylistToSave: 'Carga una lista para guardarla automáticamente',
    confirmDeletePlaylist: '¿Eliminar esta lista?',
    errorDeletingPlaylist: 'Error al eliminar la lista',
    active: 'Activa',
    delete: 'Eliminar',
    close: 'Cerrar'
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

