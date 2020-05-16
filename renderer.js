const dotenv = require('dotenv').config()
const { ipcRenderer } = require('electron')

const Display = require('./modules/display')

let display = new Display({ // Display
  path:       process.env.LOCAL,
  thumbnails: '.thumbnail',
  extension:  '.png'
})

ipcRenderer.send('get')

ipcRenderer.on('display', (event, data) => {
  display.init(data)
})
