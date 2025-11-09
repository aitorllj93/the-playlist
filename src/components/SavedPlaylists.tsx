import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	getSavedPlaylists,
	deletePlaylist,
	type SavedPlaylistInfo,
} from "../utils/playlistStorage";
import { useLanguage } from "../i18n/LanguageContext";
import ilustration from "../assets/ilustration.png";

interface SavedPlaylistsProps {
	currentPlaylistId: string | null;
	onLoadPlaylist: (playlistId: string) => void;
	onClose: () => void;
}

function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

function formatDate(timestamp: number, language: string): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return language === 'es' ? 'Justo ahora' : 'Just now';
	if (diffMins < 60) return language === 'es' ? `hace ${diffMins}m` : `${diffMins}m ago`;
	if (diffHours < 24) return language === 'es' ? `hace ${diffHours}h` : `${diffHours}h ago`;
	if (diffDays < 7) return language === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`;

	return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: "short", day: "numeric" });
}

export default function SavedPlaylists({
	currentPlaylistId,
	onLoadPlaylist,
	onClose,
}: SavedPlaylistsProps) {
	const { t, language } = useLanguage();
	const [playlists, setPlaylists] = useState<SavedPlaylistInfo[]>([]);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		loadPlaylists();
	}, []);

	const loadPlaylists = () => {
		const saved = getSavedPlaylists();
		setPlaylists(saved);
	};

	const handleDelete = async (
		e: React.MouseEvent,
		playlistId: string,
	): Promise<void> => {
		e.stopPropagation();
		if (!confirm(t("confirmDeletePlaylist") || "¿Eliminar esta playlist?"))
			return;

		setDeletingId(playlistId);
		try {
			await deletePlaylist(playlistId);
			loadPlaylists();
			if (currentPlaylistId === playlistId) {
				// Si se eliminó la playlist actual, recargar página
				window.location.reload();
			}
		} catch (error) {
			console.error("Error al eliminar playlist:", error);
			alert(t("errorDeletingPlaylist") || "Error al eliminar la playlist");
		} finally {
			setDeletingId(null);
		}
	};

	const handleLoadPlaylist = (playlistId: string) => {
		onLoadPlaylist(playlistId);
		onClose();
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
					className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#fce5e8]/40 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
					style={{
						backgroundImage: playlists.length > 0 ? `url(${ilustration})` : 'none',
						backgroundPosition: 'center top',
						backgroundRepeat: 'no-repeat',
						backgroundSize: 'contain',
						backgroundOrigin: 'content-box',
					}}
				>
				{/* Overlay para mejorar legibilidad */}
				{playlists.length > 0 && (
					<div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/80 to-white/95 rounded-2xl pointer-events-none" />
				)}

				{/* Contenido con z-index para estar sobre el fondo */}
				<div className="relative z-10 flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-[#d4725c]">
							{t("savedPlaylists") || "Playlists Guardadas"}
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-gray-400 hover:text-[#d4725c] transition-colors p-2"
							aria-label={t("close") || "Cerrar"}
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>{t("close") || "Cerrar"}</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Espaciador para el banner cuando hay playlists */}
					{playlists.length > 0 && <div className="h-32 mb-4" />}

					{/* Lista de playlists */}
					<div className="overflow-y-auto flex-1 -mx-2 px-2">
					{playlists.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							<svg
								className="w-16 h-16 mx-auto mb-4 opacity-30"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>{t("noSavedPlaylists") || "Sin playlists"}</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
								/>
							</svg>
							<p className="text-lg">
								{t("noSavedPlaylists") || "No hay playlists guardadas"}
							</p>
							<p className="text-sm mt-2">
								{t("loadPlaylistToSave") ||
									"Carga una playlist para guardarla automáticamente"}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{playlists.map((playlist, index) => {
								const isActive = playlist.id === currentPlaylistId;
								const isDeleting = deletingId === playlist.id;

								return (
									<motion.button
										key={playlist.id}
										type="button"
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={{
											duration: 0.3,
											delay: index * 0.05,
											ease: [0.16, 1, 0.3, 1]
										}}
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => handleLoadPlaylist(playlist.id)}
										disabled={isDeleting}
										className={`w-full text-left p-4 rounded-xl border transition-all ${
											isActive
												? "bg-[#fce5e8]/30 border-[#d4725c] shadow-md"
												: "bg-white/50 border-[#fce5e8]/40 hover:bg-white/80 hover:shadow-md"
										} ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<h3
														className={`font-semibold text-lg truncate ${
															isActive ? "text-[#d4725c]" : "text-gray-800"
														}`}
													>
														{playlist.name}
													</h3>
													{isActive && (
														<span className="shrink-0 px-2 py-0.5 text-xs bg-[#d4725c] text-white rounded-full">
															{t("active") || "Activa"}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4 text-sm text-gray-600">
													<span className="flex items-center gap-1">
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<title>Tracks</title>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
															/>
														</svg>
														{playlist.trackCount}{" "}
														{playlist.trackCount === 1
															? t("track")
															: t("tracks")}
													</span>
													<span className="flex items-center gap-1">
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<title>Duration</title>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
														{formatDuration(playlist.totalDuration)}
													</span>
													<span className="text-xs text-gray-400">
														{formatDate(playlist.savedAt, language)}
													</span>
												</div>
											</div>
											<button
												type="button"
												onClick={(e) => handleDelete(e, playlist.id)}
												disabled={isDeleting}
												className="shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
												aria-label={t("delete") || "Eliminar"}
											>
												{isDeleting ? (
													<svg
														className="animate-spin h-5 w-5"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<title>Loading</title>
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
												) : (
													<svg
														className="w-5 h-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<title>{t("delete") || "Eliminar"}</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												)}
											</button>
										</div>
									</motion.button>
								);
							})}
						</div>
					)}
				</div>
				</div>
			</motion.div>
		</motion.div>
		</AnimatePresence>
	);
}

