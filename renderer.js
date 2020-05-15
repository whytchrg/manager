
const dotenv = require('dotenv').config()
const { ipcRenderer } = require('electron')

const Display = require('./modules/display')

    // const Analyse = require('./modules/analysis').Analysis
    //
    // const img = "../files/arw15_10_093.jpg"
    //
    // analysis = new Analyse(img)
    //
    // console.log('path: ' + analysis.path())
    //
    // console.log('color: ' + analysis.color())
    //
    // console.log('brightness: ' + analysis.brightness())
    //
    // console.log('saturation: ' + analysis.saturation())

let display = new Display({ // Display
  path:       process.env.LOCAL,
  thumbnails: '.thumbnail',
  extension:  '.png'
})

ipcRenderer.on('display', (event, data) => {
  display.init(data)
})
