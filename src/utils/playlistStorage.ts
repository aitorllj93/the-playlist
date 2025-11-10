// Sistema de persistencia para múltiples playlists usando IndexedDB y localStorage

import type { Playlist, PlayerState } from "../types/music";

const DB_NAME = "MusicPlayerDB";
const DB_VERSION = 2; // Incrementar versión para el upgrade
const STORE_AUDIO = "audioFiles";
const STORE_IMAGES = "images";
const LOCALSTORAGE_PLAYLISTS_INDEX = "musicPlayer_playlistsIndex";
const LOCALSTORAGE_LAST_PLAYLIST = "musicPlayer_lastPlaylist";

export interface SavedPlaylistInfo {
	id: string;
	name: string;
	trackCount: number;
	totalDuration: number;
	savedAt: number; // timestamp
}

// Abrir la base de datos IndexedDB
function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Crear store para archivos de audio
			if (!db.objectStoreNames.contains(STORE_AUDIO)) {
				db.createObjectStore(STORE_AUDIO);
			}

			// Crear store para imágenes
			if (!db.objectStoreNames.contains(STORE_IMAGES)) {
				db.createObjectStore(STORE_IMAGES);
			}
		};
	});
}

// Generar ID único para una playlist
function generatePlaylistId(name: string): string {
	return `playlist_${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

// Guardar un archivo en IndexedDB con prefijo de playlist
async function saveFile(
	storeName: string,
	playlistId: string,
	key: string,
	blob: Blob,
): Promise<void> {
	const db = await openDB();
	const fullKey = `${playlistId}::${key}`;
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readwrite");
		const store = transaction.objectStore(storeName);
		const request = store.put(blob, fullKey);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

// Obtener un archivo de IndexedDB
async function getFile(
	storeName: string,
	playlistId: string,
	key: string,
): Promise<Blob | null> {
	const db = await openDB();
	const fullKey = `${playlistId}::${key}`;
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readonly");
		const store = transaction.objectStore(storeName);
		const request = store.get(fullKey);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result || null);
	});
}

// Obtener todas las claves de un store que pertenecen a una playlist
async function getPlaylistKeys(
	storeName: string,
	playlistId: string,
): Promise<string[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readonly");
		const store = transaction.objectStore(storeName);
		const request = store.getAllKeys();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const keys = request.result
				.map((key) => String(key))
				.filter((key) => key.startsWith(`${playlistId}::`))
				.map((key) => key.replace(`${playlistId}::`, ""));
			resolve(keys);
		};
	});
}

// Eliminar todas las claves de un store que pertenecen a una playlist
async function deletePlaylistFiles(
	storeName: string,
	playlistId: string,
): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readwrite");
		const store = transaction.objectStore(storeName);
		const request = store.getAllKeys();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const keysToDelete = request.result
				.map((key) => String(key))
				.filter((key) => key.startsWith(`${playlistId}::`));

			let deletedCount = 0;
			for (const key of keysToDelete) {
				const deleteRequest = store.delete(key);
				deleteRequest.onsuccess = () => {
					deletedCount++;
					if (deletedCount === keysToDelete.length) {
						resolve();
					}
				};
				deleteRequest.onerror = () => reject(deleteRequest.error);
			}

			if (keysToDelete.length === 0) {
				resolve();
			}
		};
	});
}

// Convertir un blob URL a blob
async function urlToBlob(url: string): Promise<Blob> {
	const response = await fetch(url);
	return await response.blob();
}

// Obtener el índice de playlists guardadas
function getPlaylistsIndex(): SavedPlaylistInfo[] {
	const json = localStorage.getItem(LOCALSTORAGE_PLAYLISTS_INDEX);
	return json ? JSON.parse(json) : [];
}

// Guardar el índice de playlists
function savePlaylistsIndex(playlists: SavedPlaylistInfo[]): void {
	localStorage.setItem(LOCALSTORAGE_PLAYLISTS_INDEX, JSON.stringify(playlists));
}

// Guardar una playlist completa
export async function savePlaylist(
	playlist: Playlist,
	audioFiles: Map<string, string>,
	albumArtUrls: Map<string, string>,
	playerState: PlayerState,
	playlistId?: string,
): Promise<string> {
	try {
		// Generar ID si no existe
		const id = playlistId || generatePlaylistId(playlist.name);

		// Guardar archivos de audio en IndexedDB
		for (const [fileName, blobUrl] of audioFiles.entries()) {
			const blob = await urlToBlob(blobUrl);
			await saveFile(STORE_AUDIO, id, fileName, blob);
		}

		// Guardar imágenes en IndexedDB
		for (const [fileName, blobUrl] of albumArtUrls.entries()) {
			const blob = await urlToBlob(blobUrl);
			await saveFile(STORE_IMAGES, id, fileName, blob);
		}

		// Guardar metadata en localStorage con prefijo de ID
		const playlistData = {
			name: playlist.name,
			tracks: playlist.tracks,
			totalDuration: playlist.totalDuration,
		};
		localStorage.setItem(`playlist_${id}`, JSON.stringify(playlistData));

		// Guardar estado del reproductor
		const stateData = {
			...playerState,
			isPlaying: false, // No auto-reproducir al cargar
		};
		localStorage.setItem(`state_${id}`, JSON.stringify(stateData));

		// Actualizar índice de playlists
		const playlists = getPlaylistsIndex();
		const existingIndex = playlists.findIndex((p) => p.id === id);
		const playlistInfo: SavedPlaylistInfo = {
			id,
			name: playlist.name,
			trackCount: playlist.tracks.length,
			totalDuration: playlist.totalDuration,
			savedAt: Date.now(),
		};

		if (existingIndex >= 0) {
			playlists[existingIndex] = playlistInfo;
		} else {
			playlists.push(playlistInfo);
		}
		savePlaylistsIndex(playlists);

		// Guardar como última playlist activa
		localStorage.setItem(LOCALSTORAGE_LAST_PLAYLIST, id);
		return id;
	} catch (error) {
		console.error("❌ Error al guardar la playlist:", error);
		throw error;
	}
}

// Cargar una playlist específica por ID
export async function loadPlaylistById(playlistId: string): Promise<{
	playlist: Playlist | null;
	audioFiles: Map<string, string>;
	albumArtUrls: Map<string, string>;
	playerState: PlayerState | null;
	playlistId: string | null;
}> {
	try {
		// Cargar metadata desde localStorage
		const playlistJson = localStorage.getItem(`playlist_${playlistId}`);
		const stateJson = localStorage.getItem(`state_${playlistId}`);

		if (!playlistJson) {
			return {
				playlist: null,
				audioFiles: new Map(),
				albumArtUrls: new Map(),
				playerState: null,
				playlistId: null,
			};
		}

		const playlist = JSON.parse(playlistJson) as Playlist;
		const playerState = stateJson
			? (JSON.parse(stateJson) as PlayerState)
			: null;

		// Cargar archivos de audio desde IndexedDB
		const audioFiles = new Map<string, string>();
		const audioKeys = await getPlaylistKeys(STORE_AUDIO, playlistId);
		for (const key of audioKeys) {
			const blob = await getFile(STORE_AUDIO, playlistId, key);
			if (blob) {
				const url = URL.createObjectURL(blob);
				audioFiles.set(key, url);
			}
		}

		// Cargar imágenes desde IndexedDB
		const albumArtUrls = new Map<string, string>();
		const imageKeys = await getPlaylistKeys(STORE_IMAGES, playlistId);
		for (const key of imageKeys) {
			const blob = await getFile(STORE_IMAGES, playlistId, key);
			if (blob) {
				const url = URL.createObjectURL(blob);
				albumArtUrls.set(key, url);
			}
		}

		// Marcar como última playlist activa
		localStorage.setItem(LOCALSTORAGE_LAST_PLAYLIST, playlistId);

		return {
			playlist,
			audioFiles,
			albumArtUrls,
			playerState,
			playlistId,
		};
	} catch (error) {
		console.error("❌ Error al cargar la playlist:", error);
		return {
			playlist: null,
			audioFiles: new Map(),
			albumArtUrls: new Map(),
			playerState: null,
			playlistId: null,
		};
	}
}

// Cargar la última playlist activa
export async function loadLastPlaylist(): Promise<{
	playlist: Playlist | null;
	audioFiles: Map<string, string>;
	albumArtUrls: Map<string, string>;
	playerState: PlayerState | null;
	playlistId: string | null;
}> {
	const lastPlaylistId = localStorage.getItem(LOCALSTORAGE_LAST_PLAYLIST);
	if (!lastPlaylistId) {
		return {
			playlist: null,
			audioFiles: new Map(),
			albumArtUrls: new Map(),
			playerState: null,
			playlistId: null,
		};
	}
	return loadPlaylistById(lastPlaylistId);
}

// Obtener lista de todas las playlists guardadas
export function getSavedPlaylists(): SavedPlaylistInfo[] {
	return getPlaylistsIndex().sort((a, b) => b.savedAt - a.savedAt);
}

// Eliminar una playlist específica
export async function deletePlaylist(playlistId: string): Promise<void> {
	try {
		// Eliminar archivos de audio e imágenes
		await deletePlaylistFiles(STORE_AUDIO, playlistId);
		await deletePlaylistFiles(STORE_IMAGES, playlistId);

		// Eliminar metadata
		localStorage.removeItem(`playlist_${playlistId}`);
		localStorage.removeItem(`state_${playlistId}`);

		// Actualizar índice
		const playlists = getPlaylistsIndex();
		const filtered = playlists.filter((p) => p.id !== playlistId);
		savePlaylistsIndex(filtered);

		// Si era la última playlist activa, limpiar
		if (localStorage.getItem(LOCALSTORAGE_LAST_PLAYLIST) === playlistId) {
			localStorage.removeItem(LOCALSTORAGE_LAST_PLAYLIST);
		}
	} catch (error) {
		console.error("❌ Error al eliminar la playlist:", error);
		throw error;
	}
}

// Verificar si hay playlists guardadas
export function hasStoredPlaylists(): boolean {
	return getPlaylistsIndex().length > 0;
}

// Limpiar todas las playlists (para depuración)
export async function clearAllPlaylists(): Promise<void> {
	try {
		const playlists = getPlaylistsIndex();
		for (const playlist of playlists) {
			await deletePlaylist(playlist.id);
		}
	} catch (error) {
		console.error("❌ Error al limpiar todas las playlists:", error);
		throw error;
	}
}
