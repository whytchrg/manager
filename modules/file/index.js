
"use strict"

const Extend   = require('../extend')
const Chokidar = require('chokidar')

class File extends Extend {

  constructor(options) {
    super()

    this.icon   = '𝔽  -  '
    this.module = this.constructor.name

    this.data = []

    this.init(options)
  }

  init(options) {
    const start = Date.now()
    let ready = false
    const chokidar = Chokidar.watch(options.path, {ignored: /(^|[\/\\])\../})

    chokidar.on('ready', () => {
      ready = true

      console.log(this.icon + this.countName(this.module, this.data.length) + ' / ' + (Date.now() - start) / 1000 + ' seconds')
      // console.log(this.data)
      this.emit('init')
    })
    .on('add', (path, stats) => {

      const data = this.metadata(path, stats)
      this.dataPush(data)
      if(ready) this.emit('init')
    })
    .on('change', (path, stats) => {

      const data = this.metadata(path, stats)
      this.dataUpdate(data)
      this.emit('init')
    })
    .on('unlink', path => {

      const data = this.metadata(path)
      this.dataUnlink(data)
      this.emit('init')
    })

  } // init

  metadata(path, stats) {
    let data = {
      filename: path.match(/([^\/]*)\/*$/)[1]
    }

    if(stats) {
      data.modified = Math.round(stats.mtimeMs)
    }
    return data
  } // metadata

  // ----- data methods

  dataUpdate(data) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === data.filename) {

        this.data[i].modified = data.modified

        return true
      }
    }
  } // dataUpdate

} // Files

module.exports = File
