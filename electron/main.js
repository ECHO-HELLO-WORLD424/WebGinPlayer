const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let mainWindow;
let goProcess;

function startGoServer() {
    // Resolve the path to the Go server executable
    const serverPath = path.join(process.resourcesPath, 'music-player-server');

    // Pass the resources path to the Go server
    const env = {
        ...process.env,
        RESOURCES_PATH: process.resourcesPath
    };

    // Start the Go server with the resolved path
    goProcess = spawn(serverPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env
    });

    goProcess.stdout.on('data', (data) => {
        console.log(`Go server stdout: ${data}`);
    });

    goProcess.stderr.on('data', (data) => {
        console.error(`Go server stderr: ${data}`);
    });

    goProcess.on('close', (code) => {
        console.log(`Go server process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../assets/icon/favicon.ico')
    });

    // Wait for Go server to start and then load the app
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:8081/playlist');
    }, 1000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startGoServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (goProcess) {
        goProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});