
"use strict"

const Extend   = require('../extend')
const Chokidar = require('chokidar')

class File extends Extend {

  constructor(options) {
    super()

    this.module = this.constructor.name
    this.icon   = '∎ '

    this.data = []

    this.init(options)
  }

  init(options) {

    const chokidar = Chokidar.watch(options.local, {ignored: /(^|[\/\\])\../})
    let ready = false

    chokidar.on('ready', () => {
      ready = true
      console.log(this.icon + this.log(this.module, this.data.length))
      this.emit('init')
    })
    .on('add', (path, stats) => {
      const file = this.metadata(path, stats)
      this.data.push(file)
      console.log()
      if(ready)
        this.emit('init')
    })
    .on('change', (path, stats) => {
      const file = this.metadata(path, stats)
      this.change(this.data, file, () => {
        this.emit('init', file)
      })
    })
    .on('unlink', path => {
      const file = this.metadata(path, stats)
      this.unlink(this.data, file, () => {
        this.emit('init')
      })
    })

  } // init

  metadata(path, stats) {
    const file = {
      filename: path.match(/([^\/]*)\/*$/)[1],
      path: path,
      modified: Math.round(stats.mtimeMs),
      _stats: stats
    }
    return file
  } // metadata

} // Files

module.exports = File
