export interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number; // en segundos
  filePath: string;
  fileName: string;
  albumArt?: string; // ruta al archivo de imagen del álbum
  embeddedCoverUrl?: string; // URL del cover embebido en el archivo de audio
}

export interface Playlist {
  name: string;
  tracks: Track[];
  totalDuration: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  volume: number;
  repeat: 'none' | 'all' | 'one';
  shuffle: boolean;
}
