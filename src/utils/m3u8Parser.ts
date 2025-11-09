import type { Track } from '../types/music';

export interface M3U8Info {
  duration?: number;
  title?: string;
  artist?: string;
}

/**
 * Parsea el contenido de un archivo m3u8/m3u y retorna una lista de tracks
 */
export function parseM3U8(content: string, basePath: string): Track[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const tracks: Track[] = [];
  let currentInfo: M3U8Info = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Saltar el header #EXTM3U
    if (line === '#EXTM3U') {
      continue;
    }

    // Parsear información del track #EXTINF:duration,artist - title
    if (line.startsWith('#EXTINF:')) {
      const infoLine = line.substring(8); // Remover '#EXTINF:'
      const parts = infoLine.split(',');

      if (parts.length >= 2) {
        currentInfo.duration = parseFloat(parts[0]);
        const titlePart = parts.slice(1).join(',').trim();

        // Intentar separar artista y título
        if (titlePart.includes(' - ')) {
          const [artist, title] = titlePart.split(' - ', 2);
          currentInfo.artist = artist.trim();
          currentInfo.title = title.trim();
        } else {
          currentInfo.title = titlePart;
        }
      }
    }
    // Si no es un comentario, es una ruta de archivo
    else if (!line.startsWith('#')) {
      const fileName = line.split('/').pop() || line;
      const title = currentInfo.title || fileName.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '');

      tracks.push({
        id: `${Date.now()}-${i}`,
        title: title,
        artist: currentInfo.artist,
        duration: currentInfo.duration || 0,
        filePath: line,
        fileName: fileName
      });

      // Reset current info
      currentInfo = {};
    }
  }

  return tracks;
}

/**
 * Lee el contenido de un archivo de texto
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Formatea segundos a formato mm:ss
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calcula la duración total de una playlist
 */
export function calculateTotalDuration(tracks: Track[]): number {
  return tracks.reduce((total, track) => total + track.duration, 0);
}

