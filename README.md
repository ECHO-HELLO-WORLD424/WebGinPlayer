## WebGinPlayer
![playlist](./Playlist.png)
### What is it?
- This is a web music player implemented with Go/Gin
### Features
- Supports `.wav` and `.flac` files
- Create Playlists with customizable background image
- Google Material Design
- Smooth parallax effect for background image
- Toggles between dark/light mode (Your choice will be automatically remembered).
- Audio Spectrum Visualization !
### How to use
- `go run main.go`
- Go to `127.0.0.1:8081/playlist` to see the GUI
### 🚧 Build Local Application (Nightly)
- Build go backend: `go build -o music-player-server`
- Run dist build: `npm run dist`
- The `.AppImage` will be in the `./dist` folder