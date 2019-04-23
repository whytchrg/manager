
"use strict"

const Extend   = require('../extend')
const Chokidar = require('chokidar')

class File extends Extend {

  constructor(options) {
    super()

    this.local = options.local

    this.data = []

    this.init(options)
  }

  init(options) {
    const chokidar = Chokidar.watch(options.local, {ignored: /(^|[\/\\])\../})
    let ready = false

    chokidar.on('ready', () => { // init
      ready = true
      this.emit('init')
    })

    .on('add', (path, stats) => { // add
      const file = this.metadata(path, stats)
      this.data.push(file)
      if(ready)
        this.emit('activity')
    })

    .on('change', (path, stats) => { // change
      const file = this.metadata(path, stats)
      this.change(this.data, file, () => {
        this.emit('activity', file)
      })
    })

    .on('unlink', path => { // unlink
      const file = { filename: path.replace(this.local, '') }
      this.unlink(this.data, file, () => {
        this.emit('activity')
      })
    })

  } // init

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
