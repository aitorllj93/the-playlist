export interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number; // en segundos
  filePath: string;
  fileName: string;
  albumArt?: string; // ruta al archivo de imagen del álbum
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
