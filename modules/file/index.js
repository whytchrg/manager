
"use strict"

const Extend   = require('../extend')
const Chokidar = require('chokidar')

class File extends Extend {

  constructor(options) { // path
    super()

    this.local = options.local
    this.chokidar = Chokidar.watch(this.local, {ignored: /(^|[\/\\])\../})

    // data array
    this.data    = []

    this.init()
  }

  init() {
    let ready = false

    this.chokidar.on('ready', () => { // init
      ready = true
      this.emit('init')
    })

    .on('add', (path, stats) => { // add
      const file = this.metadata(path, stats)
      this.data.push(file)
      if(ready)
        this.emit('add')
    })

    .on('change', (path, stats) => { // change
      const file = this.metadata(path, stats)
      this.change(this.data, file, function() {
        this.emit('change', file)
      }.bind(this))
    })

    .on('unlink', path => { // unlink
      const file = { filename: path.replace(this.local, '') }
      this.unlink(this.data, file, function() {
        this.emit('unlink')
      }.bind(this))
    })

  } // watcher

  metadata(path, stats) {
    const file = {
      filename: path.replace(this.local, ''),
      path: path,
      modified: Math.round(stats.mtimeMs),
      _stats: stats
    }
    return file
  } // metadata synchronous

}

module.exports = File
