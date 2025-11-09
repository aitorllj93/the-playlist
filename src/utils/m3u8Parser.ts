import type { Track } from '../types/music';

export interface M3U8Info {
  duration?: number;
  title?: string;
  artist?: string;
  albumArt?: string;
}

export interface M3U8ParseResult {
  tracks: Track[];
  groups: Map<number, string>; // Map de índice de track -> nombre de grupo
}

/**
 * Parsea el contenido de un archivo m3u8/m3u y retorna una lista de tracks y grupos
 */
export function parseM3U8(content: string, _: string): Track[];
export function parseM3U8(content: string, _: string, includeGroups: true): M3U8ParseResult;
export function parseM3U8(content: string, _: string, includeGroups?: boolean): Track[] | M3U8ParseResult {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const tracks: Track[] = [];
  const groups = new Map<number, string>();
  let currentInfo: M3U8Info = {};
  let currentAlbumArt: string | undefined; // Album art persiste para todo el álbum
  let currentGroup: string | undefined; // Grupo actual

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Saltar el header #EXTM3U
    if (line === '#EXTM3U') {
      continue;
    }

    // Parsear grupo #EXTGRP:Nombre del Grupo
    if (line.startsWith('#EXTGRP:')) {
      const groupName = line.substring(8).trim(); // Remover '#EXTGRP:'
      currentGroup = groupName;
      console.log(`📁 Grupo detectado: "${currentGroup}"`);
      continue;
    }

    // Parsear información del track #EXTINF:duration,artist - title
    if (line.startsWith('#EXTINF:')) {
      const infoLine = line.substring(8); // Remover '#EXTINF:'
      const parts = infoLine.split(',');

      if (parts.length >= 2) {
        currentInfo.duration = Number.parseFloat(parts[0]);
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
    // Parsear imagen del álbum #EXTIMG: - se aplica a todas las canciones siguientes
    else if (line.startsWith('#EXTIMG:')) {
      const imagePath = line.substring(8).trim(); // Remover '#EXTIMG:'
      currentAlbumArt = imagePath;
      console.log(`📸 Album art detectado (#EXTIMG): ${currentAlbumArt}`);
    }
    // Parsear imagen del álbum #EXTVLCOPT:arturl= - se aplica a todas las canciones siguientes
    else if (line.startsWith('#EXTVLCOPT:arturl=')) {
      const imagePath = line.substring(18).trim(); // Remover '#EXTVLCOPT:arturl='
      currentAlbumArt = imagePath;
      console.log(`📸 Album art detectado (#EXTVLCOPT): ${currentAlbumArt}`);
    }
    // Si no es un comentario, es una ruta de archivo
    else if (!line.startsWith('#')) {
      const fileName = line.split('/').pop() || line;
      const title = currentInfo.title || fileName.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '');

      // Si hay un grupo actual, guardarlo para este track
      if (currentGroup) {
        groups.set(tracks.length, currentGroup);
        console.log(`📁 Asignando grupo "${currentGroup}" al track #${tracks.length}: "${title}"`);
        currentGroup = undefined; // Reset del grupo después de asignarlo
      }

      const track = {
        id: `${Date.now()}-${i}`,
        title: title,
        artist: currentInfo.artist,
        duration: currentInfo.duration || 0,
        filePath: line,
        fileName: fileName,
        albumArt: currentAlbumArt // Usar el album art actual (persiste entre tracks)
      };

      console.log(`🎵 Track añadido: "${title}" | Album Art: ${currentAlbumArt || 'ninguno'}`);
      tracks.push(track);

      // Reset solo la info del track, NO el album art
      currentInfo = {};
    }
  }

  if (includeGroups) {
    return { tracks, groups };
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
  if (!Number.isFinite(seconds) || Number.isNaN(seconds)) {
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

