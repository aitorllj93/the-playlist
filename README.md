# 🎵 Reproductor de Música

Un reproductor de música moderno y completo desarrollado con React, TypeScript y Vite que soporta archivos m3u8/m3u para gestionar playlists.

## ✨ Características

- 📁 **Selección de carpetas**: Carga una carpeta completa con tu música y archivo m3u8
- 🎼 **Soporte m3u8/m3u**: Parser completo para archivos de playlist m3u8 y m3u
- 🎵 **Reproducción completa**: Play, pause, siguiente, anterior, búsqueda en la pista
- 🔀 **Modo aleatorio**: Reproduce las canciones en orden aleatorio
- 🔁 **Modos de repetición**: Sin repetición, repetir todas o repetir una canción
- 🔊 **Control de volumen**: Ajusta el volumen con un slider intuitivo
- 📊 **Progreso de playlist**: Visualiza el progreso total de toda la playlist
- 🎨 **Interfaz moderna**: Diseño limpio y responsive con gradientes atractivos
- ⚡ **Rendimiento optimizado**: Carga rápida y navegación fluida

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Navegar al directorio
cd music-player

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm run dev
```

## 📖 Cómo usar

1. **Inicia la aplicación** ejecutando `pnpm run dev`
2. **Haz clic en "Seleccionar Carpeta"** en la esquina superior derecha
3. **Selecciona una carpeta** que contenga:
   - Un archivo `.m3u8` o `.m3u` (playlist)
   - Los archivos de audio correspondientes (mp3, wav, ogg, m4a, flac)
4. **¡Disfruta de tu música!** El reproductor cargará automáticamente la playlist

### Formato del archivo m3u8

El reproductor soporta el formato estándar m3u8:

```m3u8
#EXTM3U
#EXTINF:180,Artista - Título de la canción
cancion1.mp3
#EXTINF:240,Otro Artista - Otra canción
cancion2.mp3
```

## 🎮 Controles

- **Play/Pause**: Reproduce o pausa la canción actual
- **Siguiente**: Avanza a la siguiente canción
- **Anterior**: Retrocede a la canción anterior (o reinicia si han pasado >3 segundos)
- **Aleatorio**: Activa/desactiva la reproducción aleatoria
- **Repetir**: Cicla entre sin repetición → repetir todas → repetir una
- **Barra de progreso**: Haz clic para saltar a cualquier parte de la canción
- **Control de volumen**: Ajusta el volumen de 0 a 100%
- **Lista de pistas**: Haz clic en cualquier pista para reproducirla directamente

## 🛠️ Tecnologías

- **React 19** - Framework de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **CSS moderno** - Gradientes, animaciones y diseño responsive

## 📝 Estructura del proyecto

```
music-player/
├── src/
│   ├── components/
│   │   ├── MusicPlayer.tsx      # Componente principal
│   │   ├── PlayerControls.tsx   # Controles de reproducción
│   │   └── PlaylistView.tsx     # Vista de la playlist
│   ├── types/
│   │   └── music.ts             # Tipos de TypeScript
│   ├── utils/
│   │   └── m3u8Parser.ts        # Parser de archivos m3u8
│   ├── App.tsx                  # Componente raíz
│   ├── App.css                  # Estilos del reproductor
│   └── index.css                # Estilos globales
└── package.json
```

## 🎨 Características de diseño

- Gradiente púrpura moderno
- Animaciones suaves en todas las interacciones
- Indicador visual de la canción en reproducción
- Barra de progreso interactiva
- Diseño responsive para móviles y tablets
- Scroll personalizado en la lista de pistas

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
