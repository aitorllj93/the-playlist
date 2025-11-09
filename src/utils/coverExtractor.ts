import { parseBlob } from 'music-metadata';

/**
 * Extrae el cover art embebido de un archivo de audio
 * @param file El archivo de audio
 * @returns URL del cover art o null si no existe
 */
export async function extractEmbeddedCover(file: File): Promise<string | null> {
  try {
    const metadata = await parseBlob(file);

    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      // Crear un nuevo Uint8Array para asegurar compatibilidad con Blob
      const imageData = new Uint8Array(picture.data);
      const blob = new Blob([imageData], { type: picture.format });
      return URL.createObjectURL(blob);
    }

    return null;
  } catch (error) {
    console.error('Error extracting embedded cover:', error);
    return null;
  }
}

/**
 * Extrae metadatos adicionales de un archivo de audio
 */
export async function extractAudioMetadata(file: File) {
  try {
    const metadata = await parseBlob(file);

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      duration: metadata.format.duration || 0,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
}

