const {app, BrowserWindow, ipcMain} = require('electron')
const {spawn} = require('child_process')
const dotenv = require('dotenv').config()
const pjson  = require('./package.json')

const Wtc     = require('./modules/wtc')

const pipe = spawn('mongod') // start MongoDB

pipe.stdout.on('data', (data) => { /* console.log(data.toString('utf8')) */ })
pipe.stderr.on('data', (data) => { console.log(data.toString('utf8')) })
pipe.on('close', (code) => { /* console.log('Process exited with code: ' + code) */ })

let mainWindow // start Electron

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 600,
    webPreferences: { nodeIntegration: true }
  })
  mainWindow.loadFile('./index.html')
  mainWindow.webContents.openDevTools()
  mainWindow.on('close', (e) => {
    console.log('application quit')
    pipe.kill('SIGINT')
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('ready', () => {
  createWindow()
})

// code
let wtc = new Wtc({
  path:       process.env.LOCAL, // path to local directory
  display:    '.display',        // display directory
  thumbnails: '.thumbnail',      // thumbnail directory
  extension:  '.png',            // preview file extension

  url:        process.env.MONGO,
  db:         pjson.name,                                 // APP name
  collection: process.env.LOCAL.match(/([^\/]*)\/*$/)[1], // Directory name
  remote:     './public_html/src/' + process.env.LOCAL.match(/([^\/]*)\/*$/)[1] + '/',
  ftphost:    process.env.FTP_HST,
  ftpport:    process.env.FTP_PRT,
  ftpuser:    process.env.FTP_USR,
  ftppass:    process.env.FTP_KEY,
  http:       process.env.HTTP,
  userid:     process.env.FLICKR_USER_ID,
  apikey:     process.env.FLICKR_API_KEY
})

wtc.init()

wtc.on('display', (data) => {
  mainWindow.webContents.send('display', data)
})

ipcMain.on('get', () => {
  let data = wtc.data()
  mainWindow.webContents.send('display', data)
})
