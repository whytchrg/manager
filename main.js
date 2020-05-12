const {app, BrowserWindow} = require('electron')
const spawn = require('child_process').spawn

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

  mainWindow.on('close', (e) => {
    console.log('application quit')
    pipe.kill('SIGINT')
  })

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

//Mongodb spawn process

const pipe = spawn('mongod')

pipe.stdout.on('data', function (data) {
 console.log(data.toString('utf8'))
})

pipe.stderr.on('data', (data) => {
 console.log(data.toString('utf8'))
})

pipe.on('close', (code) => {
 console.log('Process exited with code: ' + code)
})




// code
