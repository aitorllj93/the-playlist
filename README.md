# The Playlist

Finally, an m3u8 player that shows you where you are.

## What it does

The Playlist transforms how you experience your music collections. Load a folder, see your progress, feel the flow.

**Core features:**
- Complete playlist progress visualization
- Full m3u8/m3u format support
- Seamless playback controls
- Shuffle and repeat modes
- Clean, responsive interface

## Getting started

```bash
# Clone
git clone <repository-url>

# Install
cd the-playlist
pnpm install

# Run
pnpm run dev
```

## Deploy to GitHub Pages

Push your code. GitHub Actions handles the rest.

1. **Push to main:**
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

2. **Enable Pages:**
   - Go to repository **Settings**
   - Select **Pages**
   - Under **Source**, choose **GitHub Actions**

3. **Access your app at:**
   `https://your-username.github.io/the-playlist/`

The workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

## How to use

1. Click **Select Folder** in the top right
2. Choose a folder containing:
   - An `.m3u8` or `.m3u` playlist file
   - Your audio files (mp3, wav, ogg, m4a, flac)
3. Play

### m3u8 format

Standard format supported:

```m3u8
#EXTM3U
#EXTINF:180,Artist - Song Title
song1.mp3
#EXTINF:240,Another Artist - Another Song
song2.mp3
```

Optional Properties:

```m3u8
#EXTALB:Playlist Name
#EXTIMG:./thumbnail.jpg
#EXTVLCOPT:arturl=./thumbnail.jpg
#EXTGRP:Oberture
```

## Controls

Simple. Intuitive. Complete.

- **Play/Pause** — start or stop
- **Next/Previous** — navigate tracks
- **Shuffle** — randomize playback
- **Repeat** — none, all, or one
- **Progress bar** — jump anywhere
- **Volume** — 0 to 100%
- **Track list** — tap to play

## Built with

- React 19
- TypeScript
- Vite
- Modern CSS

## License

MIT — open and free.

---

**The Playlist** — Simple. Visual. Complete.
