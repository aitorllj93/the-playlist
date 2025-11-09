import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { Track, Playlist, PlayerState } from "../types/music";
import {
	parseM3U8,
	readTextFile,
	calculateTotalDuration,
} from "../utils/m3u8Parser";
import { extractEmbeddedCover, extractAudioMetadata } from "../utils/coverExtractor";
import {
	savePlaylist,
	loadLastPlaylist,
	loadPlaylistById,
	hasStoredPlaylists,
} from "../utils/playlistStorage";
import PlayerControls from "./PlayerControls";
import PlaylistView from "./PlaylistView";
import LanguageSelector from "./LanguageSelector";
import SavedPlaylists from "./SavedPlaylists";
import { useLanguage } from "../i18n/LanguageContext";
import logo from "../assets/logo.svg";

export default function MusicPlayer() {
	const { t } = useLanguage();

	const [playlist, setPlaylist] = useState<Playlist>({
		name: " ",
		tracks: [],
		totalDuration: 0,
	});

	const [playerState, setPlayerState] = useState<PlayerState>({
		isPlaying: false,
		currentTrackIndex: 0,
		currentTime: 0,
		volume: 0.7,
		repeat: "none",
		shuffle: false,
	});

	const [audioFiles, setAudioFiles] = useState<Map<string, string>>(new Map());
	const [albumArtUrls, setAlbumArtUrls] = useState<Map<string, string>>(
		new Map(),
	);
	const [currentPlaylistTime, setCurrentPlaylistTime] = useState(0);
	const [isLoadingStorage, setIsLoadingStorage] = useState(true);
	const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
		null,
	);
	const [showSavedPlaylists, setShowSavedPlaylists] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Restaurar playlist guardada al iniciar
	useEffect(() => {
		const restorePlaylist = async () => {
			if (hasStoredPlaylists()) {
				console.log("🔄 Restaurando última playlist...");
				const stored = await loadLastPlaylist();

				if (stored.playlist && stored.audioFiles.size > 0) {
					setPlaylist(stored.playlist);
					setAudioFiles(stored.audioFiles);
					setAlbumArtUrls(stored.albumArtUrls);
					setCurrentPlaylistId(stored.playlistId);

					if (stored.playerState) {
						setPlayerState(stored.playerState);

						// Calcular tiempo total de la playlist hasta el track actual
						let totalTime = 0;
						for (let i = 0; i < stored.playerState.currentTrackIndex; i++) {
							totalTime += stored.playlist.tracks[i]?.duration || 0;
						}
						totalTime += stored.playerState.currentTime;
						setCurrentPlaylistTime(totalTime);
					}

					console.log("✅ Playlist restaurada desde almacenamiento");
				}
			}
			setIsLoadingStorage(false);
		};

		restorePlaylist();
	}, []);

	// Guardar playlist cuando cambie (con debounce)
	useEffect(() => {
		if (isLoadingStorage || playlist.tracks.length === 0) return;

		const timeoutId = setTimeout(() => {
			console.log("💾 Guardando playlist...");
			savePlaylist(
				playlist,
				audioFiles,
				albumArtUrls,
				playerState,
				currentPlaylistId || undefined,
			)
				.then((id) => {
					if (!currentPlaylistId) {
						setCurrentPlaylistId(id);
					}
				})
				.catch((error) => {
					console.error("Error al guardar playlist:", error);
				});
		}, 1000); // Guardar 1 segundo después del último cambio

		return () => clearTimeout(timeoutId);
	}, [
		playlist,
		audioFiles,
		albumArtUrls,
		playerState,
		isLoadingStorage,
		currentPlaylistId,
	]);

	// Cargar archivo de audio cuando cambia el track
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || playlist.tracks.length === 0) return;

		const currentTrack = playlist.tracks[playerState.currentTrackIndex];
		const audioUrl = audioFiles.get(currentTrack.fileName);

		if (!audioUrl) return;

		// Solo cambiar src si es diferente
		if (audio.src !== audioUrl) {
			audio.src = audioUrl;
			audio.load(); // Forzar la carga del nuevo archivo

			// Si debería estar reproduciéndose, reproducir cuando esté listo
			if (playerState.isPlaying) {
				const playWhenReady = () => {
					audio.play().catch((err) => {
						console.error(t("errorPlaying"), err);
						setPlayerState((prev) => ({ ...prev, isPlaying: false }));
					});
				};

				// Intentar reproducir cuando haya suficientes datos
				audio.addEventListener("canplay", playWhenReady, { once: true });
			}
		}
	}, [
		playerState.currentTrackIndex,
		audioFiles,
		playlist.tracks,
		playerState.isPlaying,
		t,
	]);

	// Manejar play/pause sin reiniciar el audio
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || playlist.tracks.length === 0) return;

		if (playerState.isPlaying) {
			// Verificar si el audio está listo para reproducir
			if (audio.readyState >= 2) { // HAVE_CURRENT_DATA o superior
				audio.play().catch((err) => {
					console.error(t("errorPlaying"), err);
					setPlayerState((prev) => ({ ...prev, isPlaying: false }));
				});
			}
		} else {
			audio.pause();
		}
	}, [playerState.isPlaying, playlist.tracks.length, t]);

	// Sincronizar volumen sin reiniciar la reproducción
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = playerState.volume;
		}
	}, [playerState.volume]);

	const handleNext = useCallback(() => {
		if (playlist.tracks.length === 0) return;

		let nextIndex: number;

		if (playerState.repeat === "one") {
			nextIndex = playerState.currentTrackIndex;
			if (audioRef.current) {
				audioRef.current.currentTime = 0;
			}
		} else if (playerState.shuffle) {
			nextIndex = Math.floor(Math.random() * playlist.tracks.length);
		} else {
			nextIndex = playerState.currentTrackIndex + 1;
			if (nextIndex >= playlist.tracks.length) {
				if (playerState.repeat === "all") {
					nextIndex = 0;
				} else {
					setPlayerState((prev) => ({ ...prev, isPlaying: false }));
					return;
				}
			}
		}

		setPlayerState((prev) => ({
			...prev,
			currentTrackIndex: nextIndex,
			currentTime: 0,
			// Mantener el estado de reproducción
			isPlaying: prev.isPlaying,
		}));
	}, [
		playlist.tracks.length,
		playerState.repeat,
		playerState.shuffle,
		playerState.currentTrackIndex,
	]);

	// Actualizar tiempo actual
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => {
			setPlayerState((prev) => ({ ...prev, currentTime: audio.currentTime }));

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

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("ended", handleEnded);
		};
	}, [playerState.currentTrackIndex, playlist.tracks, handleNext]);

	// Manejar la selección de carpeta
	const handleFolderSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const fileList = Array.from(files);

		// Buscar archivo m3u8 o m3u
		const m3u8File = fileList.find(
			(file) => file.name.endsWith(".m3u8") || file.name.endsWith(".m3u"),
		);

		if (!m3u8File) {
			alert(t("noM3u8Found"));
			return;
		}

		try {
			// Leer y parsear el archivo m3u8
			const content = await readTextFile(m3u8File);
			console.log(
				"📂 Archivos en la carpeta:",
				fileList.map((f) => `${f.name} (${f.type})`),
			);
			const parsedTracks = parseM3U8(content, "");

			// Crear URLs para los archivos de audio y las imágenes del álbum
			const audioMap = new Map<string, string>();
			const artMap = new Map<string, string>();
			const loadedAlbumArts = new Map<string, string>(); // Cache de imágenes ya cargadas
			const tracksWithDuration: Track[] = [];

			// Primero, cargar todas las imágenes únicas
			const uniqueAlbumArts = new Set(
				parsedTracks.map((t) => t.albumArt).filter(Boolean),
			);

			console.log("🔍 Imágenes a buscar:", Array.from(uniqueAlbumArts));
			console.log(
				"🖼️ Archivos de imagen en la carpeta:",
				fileList
					.filter(
						(f) =>
							f.type.startsWith("image/") ||
							/\.(jpg|jpeg|png|gif|webp)$/i.test(f.name),
					)
					.map((f) => `${f.name} (${f.type || "sin tipo"})`),
			);

			for (const albumArtPath of uniqueAlbumArts) {
				if (albumArtPath) {
					const albumArtFileName =
						albumArtPath.split("/").pop() || albumArtPath;
					console.log(`🔎 Buscando: "${albumArtFileName}"`);

					// Búsqueda más flexible
					const albumArtFile = fileList.find((file) => {
						const match =
							file.name === albumArtFileName ||
							file.name.toLowerCase() === albumArtFileName.toLowerCase() ||
							// Buscar por extensión de imagen si el archivo es una imagen
							(file.type.startsWith("image/") &&
								file.name.toLowerCase() === albumArtFileName.toLowerCase()) ||
							// Buscar archivos de imagen aunque no tengan el tipo MIME correcto
							(/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) &&
								file.name.toLowerCase() === albumArtFileName.toLowerCase());

						if (match) {
							console.log(
								`   ✓ Encontrado: ${file.name} (${file.type || "sin tipo"})`,
							);
						}
						return match;
					});

					if (albumArtFile) {
						const artUrl = URL.createObjectURL(albumArtFile);
						loadedAlbumArts.set(albumArtPath, artUrl);
						console.log(
							`✓ Imagen cargada exitosamente: ${albumArtFileName} → ${artUrl.substring(0, 50)}...`,
						);
					} else {
						console.error(`✗ No se encontró la imagen: ${albumArtFileName}`);
						console.error(
							"   Archivos disponibles:",
							fileList.map((f) => f.name).join(", "),
						);
					}
				}
			}

			for (const track of parsedTracks) {
				// Buscar el archivo de audio correspondiente
				const audioFile = fileList.find(
					(file) =>
						file.name === track.fileName ||
						file.name.includes(
							track.fileName.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, ""),
						),
				);

				if (audioFile) {
					const url = URL.createObjectURL(audioFile);
					audioMap.set(track.fileName, url);

					// Extraer metadatos de audio (título, artista, etc.)
					const metadata = await extractAudioMetadata(audioFile);
					if (metadata) {
						// Actualizar título y artista si están disponibles en los metadatos
						if (metadata.title) {
							track.title = metadata.title;
							console.log(
								`🎵 Título extraído de metadatos: "${metadata.title}" para "${track.fileName}"`,
							);
						}
						if (metadata.artist) {
							track.artist = metadata.artist;
							console.log(
								`🎤 Artista extraído de metadatos: "${metadata.artist}" para "${track.fileName}"`,
							);
						}
					}

					// Extraer cover embebido del archivo MP3
					const embeddedCover = await extractEmbeddedCover(audioFile);
					if (embeddedCover) {
						track.embeddedCoverUrl = embeddedCover;
						// Usar el cover embebido en el mapa de arte del álbum
						artMap.set(track.fileName, embeddedCover);
						console.log(
							`🎨 Cover embebido encontrado para: "${track.fileName}" → ${embeddedCover.substring(0, 50)}...`,
						);
					}
					// Si no hay cover embebido, usar el del álbum de la playlist
					else if (track.albumArt && loadedAlbumArts.has(track.albumArt)) {
						const artUrl = loadedAlbumArts.get(track.albumArt);
						if (artUrl) {
							artMap.set(track.fileName, artUrl);
							console.log(
								`🔗 Asociando imagen al track: "${track.fileName}" → ${artUrl.substring(0, 50)}...`,
							);
						}
					} else if (track.albumArt) {
						console.warn(
							`⚠️ Track "${track.fileName}" tiene albumArt="${track.albumArt}" pero no está en loadedAlbumArts`,
						);
					}

					// Siempre obtener la duración real del archivo de audio
					// porque las duraciones del m3u8 no son fiables
					const audio = new Audio(url);
					await new Promise<void>((resolve) => {
						audio.addEventListener("loadedmetadata", () => {
							track.duration = audio.duration;
							resolve();
						});
						audio.addEventListener("error", () => {
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
				alert(t("noAudioFilesFound"));
				return;
			}

			setAudioFiles(audioMap);
			setAlbumArtUrls(artMap);

			console.log("📊 Resumen de carga:");
			console.log(`   - Tracks cargados: ${tracksWithDuration.length}`);
			console.log(`   - Audio URLs: ${audioMap.size}`);
			console.log(`   - Album Art URLs: ${artMap.size}`);
			console.log(
				"   - Mapeo de imágenes:",
				Array.from(artMap.entries()).map(
					([k, v]) => `"${k}" → ${v.substring(0, 40)}...`,
				),
			);

			const totalDuration = calculateTotalDuration(tracksWithDuration);
			setPlaylist({
				name: m3u8File.name.replace(/\.(m3u8|m3u)$/i, ""),
				tracks: tracksWithDuration,
				totalDuration,
			});

			setPlayerState((prev) => ({
				...prev,
				currentTrackIndex: 0,
				currentTime: 0,
				isPlaying: true,
			}));
			setCurrentPlaylistTime(0);

			// Marcar que ya no estamos cargando desde storage
			setIsLoadingStorage(false);

			// Guardar inmediatamente la playlist
			setTimeout(() => {
				savePlaylist(
					{
						name: m3u8File.name.replace(/\.(m3u8|m3u)$/i, ""),
						tracks: tracksWithDuration,
						totalDuration,
					},
					audioMap,
					artMap,
					{
						isPlaying: false,
						currentTrackIndex: 0,
						currentTime: 0,
						volume: playerState.volume,
						repeat: playerState.repeat,
						shuffle: playerState.shuffle,
					},
					undefined, // Nuevo ID para nueva playlist
				)
					.then((id) => {
						setCurrentPlaylistId(id);
					})
					.catch((error) => {
						console.error("Error al guardar playlist inicial:", error);
					});
			}, 100);
		} catch (error) {
			console.error("Error al cargar la playlist:", error);
			alert(t("errorLoadingPlaylist"));
		}
	};

	const handlePlay = useCallback(() => {
		if (audioRef.current && playlist.tracks.length > 0) {
			audioRef.current.play();
			setPlayerState((prev) => ({ ...prev, isPlaying: true }));
		}
	}, [playlist.tracks.length]);

	const handlePause = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			setPlayerState((prev) => ({ ...prev, isPlaying: false }));
		}
	}, []);

	const handlePrevious = useCallback(() => {
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
				if (playerState.repeat === "all") {
					prevIndex = playlist.tracks.length - 1;
				} else {
					prevIndex = 0;
				}
			}
		}

		setPlayerState((prev) => ({
			...prev,
			currentTrackIndex: prevIndex,
			currentTime: 0,
			// Mantener el estado de reproducción
			isPlaying: prev.isPlaying,
		}));
	}, [
		playlist.tracks.length,
		playerState.currentTime,
		playerState.shuffle,
		playerState.repeat,
		playerState.currentTrackIndex,
	]);

	const handleSeek = useCallback((time: number) => {
		if (audioRef.current) {
			audioRef.current.currentTime = time;
			setPlayerState((prev) => ({ ...prev, currentTime: time }));
		}
	}, []);

	const handleVolumeChange = (volume: number) => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
		setPlayerState((prev) => ({ ...prev, volume }));
	};

	const handleRepeatChange = () => {
		setPlayerState((prev) => {
			const repeatModes: Array<"none" | "all" | "one"> = ["none", "all", "one"];
			const currentIndex = repeatModes.indexOf(prev.repeat);
			const nextIndex = (currentIndex + 1) % repeatModes.length;
			return { ...prev, repeat: repeatModes[nextIndex] };
		});
	};

	const handleShuffleChange = () => {
		setPlayerState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
	};

	const handleTrackSelect = (index: number) => {
		setPlayerState((prev) => ({
			...prev,
			currentTrackIndex: index,
			currentTime: 0,
			isPlaying: true,
		}));
	};

	const handleLoadSavedPlaylist = async (playlistId: string) => {
		try {
			setIsLoadingStorage(true);
			console.log(`🔄 Cargando playlist guardada: ${playlistId}`);
			const stored = await loadPlaylistById(playlistId);

			if (stored.playlist && stored.audioFiles.size > 0) {
				setPlaylist(stored.playlist);
				setAudioFiles(stored.audioFiles);
				setAlbumArtUrls(stored.albumArtUrls);
				setCurrentPlaylistId(stored.playlistId);

				if (stored.playerState) {
					// Activar reproducción automática al cambiar de playlist
					setPlayerState({
						...stored.playerState,
						isPlaying: true,
					});

					// Calcular tiempo total de la playlist hasta el track actual
					let totalTime = 0;
					for (let i = 0; i < stored.playerState.currentTrackIndex; i++) {
						totalTime += stored.playlist.tracks[i]?.duration || 0;
					}
					totalTime += stored.playerState.currentTime;
					setCurrentPlaylistTime(totalTime);
				}

				console.log("✅ Playlist cargada exitosamente y reproduciendo");
			}
		} catch (error) {
			console.error("Error al cargar playlist guardada:", error);
			alert(t("errorLoadingPlaylist"));
		} finally {
			setIsLoadingStorage(false);
		}
	};

	const currentTrack = playlist.tracks[playerState.currentTrackIndex] || null;
	const currentAlbumArt = currentTrack
		? albumArtUrls.get(currentTrack.fileName)
		: null;

	console.log("🎨 Render - Track actual:", currentTrack?.title);
	console.log("   - fileName:", currentTrack?.fileName);
	console.log("   - albumArt en track:", currentTrack?.albumArt);
	console.log(
		"   - Album Art URLs disponibles:",
		Array.from(albumArtUrls.keys()),
	);
	console.log("   - Album Art URL encontrada:", currentAlbumArt || "NINGUNA");

	// Integración con Media Session API para controles del teclado
	useEffect(() => {
		if ("mediaSession" in navigator && currentTrack) {
			// Actualizar metadatos
			navigator.mediaSession.metadata = new MediaMetadata({
				title: currentTrack.title,
				artist: currentTrack.artist || "Unknown Artist",
				album: playlist.name || "Unknown Album",
				artwork: currentAlbumArt
					? [
							{
								src: currentAlbumArt,
								sizes: "512x512",
								type: "image/jpeg",
							},
					  ]
					: [],
			});

			// Registrar handlers para las acciones de medios
			navigator.mediaSession.setActionHandler("play", () => {
				handlePlay();
			});

			navigator.mediaSession.setActionHandler("pause", () => {
				handlePause();
			});

			navigator.mediaSession.setActionHandler("previoustrack", () => {
				handlePrevious();
			});

			navigator.mediaSession.setActionHandler("nexttrack", () => {
				handleNext();
			});

			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (details.seekTime !== undefined) {
					handleSeek(details.seekTime);
				}
			});

			navigator.mediaSession.setActionHandler("seekbackward", (details) => {
				const skipTime = details.seekOffset || 10;
				if (audioRef.current) {
					handleSeek(Math.max(0, audioRef.current.currentTime - skipTime));
				}
			});

			navigator.mediaSession.setActionHandler("seekforward", (details) => {
				const skipTime = details.seekOffset || 10;
				if (audioRef.current && currentTrack) {
					handleSeek(
						Math.min(currentTrack.duration, audioRef.current.currentTime + skipTime)
					);
				}
			});

			// Actualizar el estado de posición
			if (audioRef.current && currentTrack.duration) {
				navigator.mediaSession.setPositionState({
					duration: currentTrack.duration,
					playbackRate: audioRef.current.playbackRate,
					position: playerState.currentTime,
				});
			}
		}

		return () => {
			// Limpiar handlers al desmontar
			if ("mediaSession" in navigator) {
				navigator.mediaSession.setActionHandler("play", null);
				navigator.mediaSession.setActionHandler("pause", null);
				navigator.mediaSession.setActionHandler("previoustrack", null);
				navigator.mediaSession.setActionHandler("nexttrack", null);
				navigator.mediaSession.setActionHandler("seekto", null);
				navigator.mediaSession.setActionHandler("seekbackward", null);
				navigator.mediaSession.setActionHandler("seekforward", null);
			}
		};
	}, [
		currentTrack,
		currentAlbumArt,
		playerState.currentTime,
		playlist.name,
		handlePlay,
		handlePause,
		handlePrevious,
		handleNext,
		handleSeek,
	]);

	return (
		<>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-12 gap-4 sm:gap-6 relative z-10 min-h-0"
			>
				{/* Mensaje de carga desde storage */}
				{isLoadingStorage && (
					<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-lg border border-[#fce5e8]/40 animate-[fadeIn_0.3s_ease-out]">
						<div className="flex items-center gap-3">
							<svg
								className="animate-spin h-5 w-5 text-[#d4725c]"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span className="text-[#d4725c] font-medium">
								{t("loadingPlaylist") || "Cargando playlist..."}
							</span>
						</div>
					</div>
				)}

				{/* Header con botón para cargar playlist */}
				<div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-6 lg:gap-8 mb-2">
					<h1 className="flex items-center gap-2 sm:gap-3 text-3xl sm:text-4xl lg:text-5xl font-logo font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-[#f9b69d] to-[#ff9999] m-0 shrink-0">
						<img
							src={logo}
							alt={t("music")}
							width="36"
							height="36"
							className="inline-block sm:w-[42px] sm:h-[42px] lg:w-[50px] lg:h-[50px]"
						/>
						{t("music")}
					</h1>

					<div className="flex items-center gap-2 sm:gap-3 lg:gap-4 relative">
						<LanguageSelector />

						{/* Botón de playlists guardadas */}
						{hasStoredPlaylists() && (
							<button
								type="button"
								className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/70 backdrop-blur-xl text-[#d4725c] border border-[#fce5e8]/40 rounded-full text-sm font-medium cursor-pointer transition-all hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(249,182,157,0.2)] hover:-translate-y-0.5 active:translate-y-0"
								onClick={() => setShowSavedPlaylists(true)}
								aria-label={t("savedPlaylists") || "Playlists guardadas"}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-4 h-4 sm:w-5 sm:h-5"
									aria-hidden="true"
								>
									<title>{t("savedPlaylists") || "Playlists guardadas"}</title>
									<path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
								</svg>
								<span className="hidden sm:inline">
									{t("playlists") || "Playlists"}
								</span>
							</button>
						)}

						<div className="relative">
							<button
								type="button"
								className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 lg:py-3.5 bg-white/70 backdrop-blur-xl text-[#d4725c] border border-[#fce5e8]/40 rounded-full text-sm sm:text-base font-medium cursor-pointer transition-all hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(249,182,157,0.2)] hover:-translate-y-0.5 active:translate-y-0"
								onClick={() => fileInputRef.current?.click()}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-4 h-4 sm:w-5 sm:h-5"
									aria-hidden="true"
								>
									<title>{t("folder")}</title>
									<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
								</svg>
								<span className="hidden xs:inline">{t("selectFolder")}</span>
								<span className="inline xs:hidden">{t("folder")}</span>
							</button>

							{/* Flecha dibujada a mano señalando el botón cuando no hay playlist */}
							{playlist.tracks.length === 0 && (
								<div className="z-10 absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none animate-[bounce_2s_ease-in-out_infinite]">
									<svg
										width="140"
										height="100"
										viewBox="0 0 140 100"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										className="text-[#f9b69d] opacity-90"
										aria-hidden="true"
									>
										<title>{t("clickHere")}</title>
										{/* Flecha curva dibujada a mano - apuntando hacia arriba al botón */}
										<path
											d="M 20 80 Q 35 50, 60 20 Q 68 10, 75 8"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
											fill="none"
											style={{
												filter:
													"drop-shadow(0 2px 8px rgba(249, 182, 157, 0.4))",
											}}
										/>
										{/* Punta de la flecha */}
										<path
											d="M 75 8 L 68 6 M 75 8 L 72 15"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										{/* Texto de ayuda */}
										<text
											x="5"
											y="95"
											fill="currentColor"
											fontSize="15"
											fontWeight="600"
											fontFamily="system-ui, -apple-system, sans-serif"
											style={{
												filter: "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))",
											}}
										>
											{t("clickHere") || "¡Empieza aquí!"}
										</text>
									</svg>
								</div>
							)}
						</div>
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
			<div className="flex flex-col gap-6 flex-1 min-h-0">
				{/* Vista de la playlist */}
				<PlaylistView
					tracks={playlist.tracks}
					currentTrackIndex={playerState.currentTrackIndex}
					onTrackSelect={handleTrackSelect}
					playlistName={playlist.name}
					totalDuration={playlist.totalDuration}
					currentPlaylistTime={currentPlaylistTime}
					isPlaying={playerState.isPlaying}
				/>
			</div>

			{/* Controles del reproductor - flotante (solo cuando hay tracks) */}
			{playlist.tracks.length > 0 && (
				<PlayerControls
					currentTrack={currentTrack}
					currentAlbumArt={currentAlbumArt}
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
			)}
			</motion.div>

			{/* Modal de playlists guardadas */}
			{showSavedPlaylists && (
				<SavedPlaylists
					currentPlaylistId={currentPlaylistId}
					onLoadPlaylist={handleLoadSavedPlaylist}
					onClose={() => setShowSavedPlaylists(false)}
				/>
			)}
		</>
	);
}
