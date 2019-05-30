
"use strict"

const Extend    = require('../extend')
const ftpClient = require('ftp')
const fs        = require('fs') // for progress

class Ftp extends Extend {

  constructor(options) { // host, port, user, pass, path
    super()
    this.icon = '⋏ '
    this.module = this.constructor.name

    this.client  = new ftpClient()
    this.remote  = options.remote + '/'
    this.local   = options.local

    // Array
    this.data = []

    this.extension = '.png'
    this.dsply = 'display'
    this.thumb = 'thumbnail'

    this.init(options)

  }

  init(options) { // init || create this.data

    const properties = {
      host: options.ftphost,
      port: options.ftpport,
      user: options.ftpuser,
      password: options.ftppass,
      secure: true,
      passvTimeout: 20000,
      keepalive: 20000,
      secureOptions: { rejectUnauthorized: false }
    }

    this.client.connect(properties)
    this.client.on('ready', () => {
      this.client.mkdir(this.remote, true, (err) => {
        if (err) throw err
        this.client.list(this.remote, (err, list) => {
          if (err) throw err

          // console.log(this.remote)
          if(list.length === 0) {
            console.log(this.icon + this.log(this.module, this.data.length))
            console.log(this.data)
            this.emit('init')
          } else {
            let c = 0
            list.forEach((ftp, index, array) => {
              const date = Number( new Date(ftp.date).getTime() )
              this.data[index] = { filename: ftp.name, modified: date }
              c++
              if(c === array.length){
                console.log(this.icon + this.log(this.module, this.data.length))
                this.emit('init')
              }
            })
          }

        })
      })
    })
  } // init

  async evaluate(mongos) {

    let p = false

    const a = this.newFiles(mongos, this.data)
    const b = this.modMongo(mongos, this.data)
    const c = this.oldFiles(mongos, this.data)

    if(await a && await b && await c){

      if(a.length + b.length + c.length > 0){
        p = true
        this.emit('progress')
      }

      console.log(this.icon + this.log(this.module, a.length) + ' to insert from Mongo')
      const i = this.upload(a)

      console.log(this.icon + this.log(this.module, b.length) + ' to update from Mongo')
      const u = this.upload(b, 'update')

      console.log(this.icon + this.log(this.module, c.length) + ' to delete from Mongo')
      const d = this.delete(c)

      if(await i && await u && await d){
        if(p) this.emit('done')
        return true
      }
    }

  } // evaluate

  // evaluate(data) {
  //   console.log('- evaluate ftp')
  //
  //
  //   // Upload
  //   this.getNew(data, this.data, (select) => {
  //     console.log(select.length + ' files to upload')
  //     this.upload(select)
  //   })
  //
  //   // Delete
  //   this.getDeleted(data, this.data, (select) => {
  //     console.log(select.length + ' files to delete')
  //     this.delete(select)
  //   })
  //
  // } // evaluate END !!

  makeupload(files, mode, callback) {

    let upload = []
    this.client.mkdir(this.remote + '.' + this.dsply + '/', true, (err) => {
      if (err) throw err
      this.client.mkdir(this.remote + '.' + this.thumb +'/', true, (err) => {
        if (err) throw err
        let counter = 0
        files.forEach((element, index, array) => {
          console.log(element);
          if(mode === 'upload') this.upData(element)
          const a = {
            filename: element.filename,
            path: element.path,
            remote: this.remote + element.filename
          }
          const b = {
            filename: element.filename,
            path: element.display,
            remote: this.remote + '.' + this.dsply + '/' + element.name + this.extension
          }
          const c = {
            filename: element.filename,
            path: element.thumbnail,
            remote: this.remote + '.' + this.thumb + '/' + element.name + this.extension
          }
          upload.push(a)
          upload.push(b)
          upload.push(c)
          counter++
          if(counter === array.length){
            callback(upload)
          }
        })
      })
    })

  } // makeupload

  upload(upload, mode = 'upload') {
    return new Promise((resolve, reject) => {
      if(upload.length === 0) {
        resolve(true)
      }
      this.makeupload(upload, mode, (files) => {

        let c = 0
        files.forEach((file, index, array) => {
          if(index === 0) {
            console.log(this.icon + this.module + ' upload')
          }

          const stats = fs.statSync(file.path)
          const fileSize = stats.size
          let uploadedSize = 0
          let uploadfile = fs.createReadStream(file.path)
          uploadfile.on('data', function(buffer) {
            let segmentLength = buffer.length
            uploadedSize += segmentLength
            let percent = (uploadedSize/fileSize*100).toFixed(2)
            console.log("Progress:\t",(percent + "%"))

          })

          this.client.put(uploadfile, file.remote, () => {
            // if (err) throw err
            console.log('uploaded: ' + file.filename)
            c++
            if(c === array.length){
              // files = []
              console.log(this.icon + this.module + ' uploaded')
              resolve(true)
            }

          })
        })

      })
    })
  } // upload END !!

  delete(files) {
    return new Promise((resolve, reject) => {
      if(files.length === 0) {
        resolve(true)
      }
      let c = 0
      files.forEach((file, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' delete')
        }
        this.offData(file)
        this.client.delete(this.remote + file.filename, () => {
          // if (err) throw err
          // console.log(file.filename)
          c++
          if(c === array.length){
            files = []
            console.log(this.icon + this.module + ' deleted')
            resolve(true)
          }
        })
      })
    })
  } // delete END !!

  changeData(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data[index] = file
      }
    }.bind(this))
  } // offData END !!

  offData(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data.splice(index, 1)
      }
    }.bind(this))
  } // offData END !!

  upData(file) {
    this.data.push({ filename: file.filename })
  } // offData END !!

  log_ftp(n) {
    return (n === 1 ? n + ' ftp' : n + ' ftps');
  }

}

module.exports = Ftp
