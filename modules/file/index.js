 
"use strict"

const Extend   = require('../extend')
const Chokidar = require('chokidar')

class File extends Extend {

  constructor(options) {
    super()

    this.module = this.constructor.name
    this.icon   = '∎ '

    this.path = options.local

    this.data = []

    this.init()
  }

  init() {
    let ready = false
    const chokidar = Chokidar.watch(this.path, {ignored: /(^|[\/\\])\../})

    chokidar.on('ready', () => {
      ready = true

      console.log(this.icon + this.log(this.module, this.data.length))
      this.emit('init')
    })
    .on('add', (path, stats) => {

      if(this.dataInsert(path, stats)) {
        if(ready) this.emit('init')
      }
    })
    .on('change', (path, stats) => {

      if(this.dataUpdate(path, stats)) {
        this.emit('init')
      }
    })
    .on('unlink', path => {

      if(this.unlinkData(path)) {
        this.emit('init')
      }
    })

  } // init

  dataInsert(path, stats) {
    let result = false
    const file = this.metadata(path, stats)

    if(this.data.push(file)) {

      result = true
    }

    return result
  } // dataUpdate

  dataUpdate(path, stats) {
    let result = false
    const file = this.metadata(path, stats)

    for(let i = 0; i < this.data.length; i++) {

      if(this.data[i].filename === file.filename) {

        this.data[i].modified = file.modified
        this.data[i]._stats   = file._stats

        result = true
      }
    }

    return result
  } // dataUpdate

  dataUnlink(path) {
    let result = false
    const file = this.metadata(path)

    for(let i = 0; i < this.data.length; i++) {

      if(this.data[i].filename === file.filename) {

        this.data.splice(i, 1)

        result = true
      }
    }

    return result
  } // dataUnlink

  metadata(path, stats) {
    let file = {
      filename: this.filename(path),
      path: path
    }

    if(stats) {
      file.modified = Math.round(stats.mtimeMs)
      file._stats   = stats
    }

    return file
  } // metadata

} // Files

module.exports = File
