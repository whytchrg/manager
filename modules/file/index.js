
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

    const chokidar = Chokidar.watch(this.path, {ignored: /(^|[\/\\])\../})
    let ready = false

    chokidar.on('ready', () => {
      ready = true
      console.log(this.icon + this.log(this.module, this.data.length))
      this.emit('init')
    })
    .on('add', (path, stats) => {
      const file = this.metadata(path, stats)
      this.data.push(file)
      if(ready)
        this.emit('init')
    })
    .on('change', (path, stats) => {
      const file = this.metadata(path, stats)
      const change = this.changeNEW(file)
      if(change) {
        this.emit('init', file)
      }
    })
    .on('unlink', path => {
      const file = { filename: this.filename(path) }
      this.unlink(this.data, file, () => {
        this.emit('init')
      })
    })

  } // init

  metadata(path, stats) {
    const file = {
      filename: this.filename(path),
      path: path,
      modified: Math.round(stats.mtimeMs),
      _stats: stats
    }
    return file
  } // metadata

  filename(path) {
    return path.match(/([^\/]*)\/*$/)[1]
  }

} // Files

module.exports = File
