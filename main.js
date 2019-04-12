const {app, BrowserWindow} = require('electron')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('./index.html')

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () { // Emitted when the window is closed.
    mainWindow = null
  })

}

app.on('ready', createWindow) // Electron has is initialized.

app.on('window-all-closed', function () { // Quit when all windows are closed (macOS).
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () { // Re-create a window in the app when the dock icon is clicked. (macOS)
  if (mainWindow === null) {
    createWindow()
  }
})

// code
