
"use strict"

const Extend    = require('../extend')
const ftpClient = require('ftp')
const fs        = require('fs') // for progress

class Ftp extends Extend {

  constructor(options) { // host, port, user, pass, path
    super()

    this.icon = '⫸  -  '
    this.module = this.constructor.name

    this.path       = options.path
    this.remote     = options.remote
    this.display    = options.display
    this.thumbnails = options.thumbnails
    this.extension  = options.extension
    this.options    = {
      host: options.ftphost,
      port: options.ftpport,
      user: options.ftpuser,
      password: options.ftppass,
      secure: true,
      passvTimeout: 20000,
      keepalive: 20000,
      secureOptions: { rejectUnauthorized: false }
    }
    this.client     = new ftpClient()

    this.data = []

    this.init(options)
  } // constructor

  init(options) {

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
            console.log(this.icon + this.countName(this.module, this.data.length))
            console.log(this.data)
            this.emit('init')
          } else {
            let c = 0
            list.forEach((ftp, index, array) => {
              const date = Number( new Date(ftp.date).getTime() )
              this.data[index] = { filename: ftp.name }
              c++
              if(c === array.length){
                console.log(this.icon + this.countName(this.module, this.data.length))
                // console.log(this.data)
                this.emit('init')
              }
            })
          }

        })
      })
    })
  } // init

  upload(upload, mode = 'upload') {
    return new Promise((resolve, reject) => {

      if(mode === 'upload') {
        console.log(this.icon + this.countName(this.module, upload.length) + ' to insert from Files')
      } else {
        console.log(this.icon + this.countName(this.module, upload.length) + ' to update from Files')
      }

      if(upload.length === 0) {
        resolve(true)
      }
      this.makeupload(upload, mode, (files) => {

        let c = 0
        files.forEach((file, index, array) => {
          if(index === 0) {
            console.log(this.icon + this.module + ' upload // ' + this.countName('File', files.length / 3))
          }
          // console.log(file.path)
          // const stats = fs.statSync(file.path)
          // const fileSize = stats.size
          // let uploadedSize = 0
          // let uploadfile = fs.createReadStream(file.path)
          // // let uploadfile = Buffer.alloc(fileSize, file.path)
          // let d = 0
          // uploadfile.on('data', (buffer) => {
          //   // if(d++ === 0) console.log(this.icon + file.log)
          //
          //   let segmentLength = buffer.length
          //   uploadedSize += segmentLength
          //   console.log("Progress:\t" + ((uploadedSize/fileSize*100).toFixed(2) + "%"));
          //   // let percent = (uploadedSize/fileSize*100).toFixed(2)
          //   // console.log((percent + "%"))
          //
          // })

          this.client.put(file.path, file.remote, (err) => {
            if (err) throw err

            c++
            if(c === array.length){
              // files = []
              console.log(this.icon + this.module + ' upload // ' + this.countName('File', files.length / 3) + ' √')
              resolve(true)
            }

          })
        })

      })
    })
  } // upload END !!

  delete(files) {
    return new Promise((resolve, reject) => {
      console.log(this.icon + this.countName(this.module, files.length) + ' to delete from Files')
      if(files.length === 0) {
        resolve(true)
      }
      let c = 0
      files.forEach((file, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' delete')
        }
        this.dataUnlink(file)
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

  makeupload(files, mode, callback) {

    let upload = []
    this.client.mkdir(this.remote + this.display + '/', true, (err) => {
      if (err) throw err
      this.client.mkdir(this.remote + this.thumbnails + '/', true, (err) => {
        if (err) throw err
        let counter = 0
        files.forEach((element, index, array) => {
          // console.log(element);
          if(mode === 'upload') this.data.push({ filename: element.filename })
          const a = {
            log: element.filename,
            filename: element.filename,
            path: this.path + element.filename,
            remote: this.remote + element.filename
          }
          const display = this.display + '/' + element.filename.split('.').slice(0, -1).join('.') + this.extension
          const b = {
            log: display,
            filename: element.filename,
            path: this.path + display,
            remote: this.remote + display
          }
          const thumbnail = this.thumbnails + '/' + element.filename.split('.').slice(0, -1).join('.') + this.extension
          const c = {
            log: thumbnail,
            filename: element.filename,
            path: this.path + thumbnail,
            remote: this.remote + thumbnail
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

}

module.exports = Ftp
