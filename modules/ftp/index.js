
"use strict"

const Extend    = require('../extend')
const ftpClient = require('ftp')
const fs        = require('fs') // for progress

class Ftp extends Extend {

  constructor(options) { // host, port, user, pass, path
    super()

    this.client  = new ftpClient()
    this.remote  = options.remote + '/'
    this.local   = options.local

    // Array
    this.data = []

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
            console.log(this.log_ftp(this.data.length))
            this.emit('init')
          } else {
            let c = 0
            list.forEach((ftp, index, array) => {
              const date = Number( new Date(ftp.date).getTime() )
              this.data[index] = { filename: ftp.name, modified: date }
              c++
              if(c === array.length){
                console.log(this.log_ftp(this.data.length))
                this.emit('init')
              }
            })
          }

        })
      })
    })
  } // init

  evaluate(data) {
    console.log('- evaluate ftp')


    // Upload
    this.getNew(data, this.data, (select) => {
      console.log(select.length + ' files to upload')
      this.upload(select)
    })

    // Delete
    this.getDeleted(data, this.data, (select) => {
      console.log(select.length + ' files to delete')
      this.delete(select)
    })

  } // evaluate END !!

  makeupload(files, callback) {

    let upload = []
    this.client.mkdir(this.remote + '.display/', true, (err) => {
      if (err) throw err
      this.client.mkdir(this.remote + '.thumbnail/', true, (err) => {
        if (err) throw err
        let counter = 0
        files.forEach((element, index, array) => {
          console.log(element);
          this.upData(element)
          const a = {
            filename: element.filename,
            path: element.path,
            remote: this.remote + element.filename
          }
          const b = {
            filename: element.filename,
            path: element.display,
            remote: this.remote + '.display/' + element.filename
          }
          const c = {
            filename: element.filename,
            path: element.thumbnail,
            remote: this.remote + '.thumbnail/' + element.filename
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

  upload(upload) {
    this.makeupload(upload, (files) => {

      let c = 0
      files.forEach(function(file, index, array) {
        if(index === 0) {
          console.log('-- upload start')
          this.emit('progress')
        }

        const stats = fs.statSync(file.path)
        const fileSize = stats.size
        let uploadedSize = 0
        let uploadfile = fs.createReadStream(file.path)
        uploadfile.on('data', function(buffer) {
          let segmentLength = buffer.length
          uploadedSize += segmentLength
          console.log("Progress:\t",((uploadedSize/fileSize*100).toFixed(2)+"%"))
        })

        this.client.put(uploadfile, file.remote, function() {
          // if (err) throw err
          console.log('uploaded: ' + file.filename)
          c++
          if(c === array.length){
            // files = []
            console.log('-- upload done')
            this.emit('done')
          }

        }.bind(this))
      }.bind(this))

    })
  } // upload END !!

  delete(files) {

      let c = 0
      files.forEach(function(file, index, array) {
        if(index === 0) {
          console.log('-- ftp delete')
        }
        this.offData(file)
        this.client.delete(this.remote + file.filename, function() {
          // if (err) throw err
          console.log(file.filename)
          c++
          if(c === array.length){
            files = []
            console.log('-- ftp delete done')
          }
        }.bind(this))
      }.bind(this))

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
