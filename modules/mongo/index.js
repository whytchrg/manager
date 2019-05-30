
"use strict"

const Extend   = require('../extend')
const mongodb  = require('mongodb').MongoClient
const exiftool = require("exiftool-vendored").exiftool
const gm       = require('gm')
const fs       = require('fs')

class Mongo extends Extend {

  constructor(options) { // url, db, collection
    super()

    this.module = this.constructor.name
    this.icon   = '⋑ '

    // settings
    this.extension = '.png'
    this.dsplyShort = 600
    this.thumbShort = 100
    this.dsply = 'display'
    this.thumb = 'thumbnail'

    this.collection

    this.data = []

    this.init(options)
  }

  init(options) { // init this.collection

    const client = new mongodb(options.url, {
      poolSize: 10,
      useNewUrlParser: true,
      connectTimeoutMS: 300000
    })

    client.connect((err, connect) => {
      if (err) throw err
      this.collection = connect.db(options.db).collection(options.collection)
      this.collection.find({}).toArray((err, data) => {
        if (err) throw err
        this.data = data
        console.log(this.icon + this.log(this.module, this.data.length))
        console.log(this.data)
        this.emit('init')
      })
    })
  } // init

  async evaluate(files, flickr, mysql) {

    let p = false

    const a = this.newFiles(files, this.data)
    const b = this.modFiles(files, this.data)
    const c = this.oldFiles(files, this.data)

    const f = this.getflickr(flickr, this.data)
    // const n = this.notflickr(flickr, this.data)

    const m = this.getmysql(mysql, this.data)

    if(await a && await b && await c && await f && await m){

      if(a.length + b.length + c.length + f.length + m.length > 0){
        p = true
        this.emit('progress')
      }

      console.log(this.icon + this.log(this.module, a.length) + ' to insert from Files')
      const i = this.insertNEW(a)

      console.log(this.icon + this.log(this.module, b.length) + ' to update from Files')
      const u = this.updateNEW(b)

      console.log(this.icon + this.log(this.module, c.length) + ' to delete from Files')
      const d = this.deleteNEW(c)

      console.log(this.icon + this.log(this.module, f.length) + ' to update from Flickr')
      const r = this.flickrNEW(f)

      console.log(this.icon + this.log(this.module, m.length) + ' to update from Mysql')
      const s = this.mysqlNEW(m)

      if(await i && await u && await d && await r && await s){
        if(p) this.emit('done')
        return true
      }
    }

  } // evaluateFiles

  mysqlNEW(select) {
    console.log(select)

    return new Promise((resolve, reject) => {
      if(select.length === 0) {
        resolve(true)
      }
      let c = 0
      select.forEach((m, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' mysql')
        }
        this.mysqlChange(m)

        console.log(m.filename)
        console.log(m.views)
        // update mongo
        const search = { filename: m.filename }
        const query = { $set: {
          views_mysql: m.views,
          modified_mongo: new Date().getTime()
        }}
        this.collection.updateOne(search, query, (err, res) => {
          if (err) throw err
          c++
          if(c === array.length) {
            console.log(this.icon + this.module + ' mysqled')
            resolve(true)
          }
        })



      })
    })
  }

  getmysql(a, b) {
    let select = []
    for (let i = 0; i < a.length; i++) {
      let test = false

      for (var j = 0; j < b.length; j++) {
        if(a[i].filename === b[j].filename) {

          let views_mysql = []
          // console.log(b[j].views_mysql)
          if(b[j].views_mysql) {
            if(b[j].views_mysql[0].server) {
                views_mysql = b[j].views_mysql
            }
          }

          if(views_mysql.length != a[i].views.length) {

            test = true
          }
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // flickr

  flickrNEW(select) {
    console.log(select)

    return new Promise((resolve, reject) => {
      if(select.length === 0) {
        resolve(true)
      }
      let c = 0
      select.forEach((f, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' flickr')
        }
        this.flickrChange(f)

        // update mongo
        const search = { name: f.title }
        const query = { $set: {
          added: f.added,
          views_flickr: f.views_flickr,
          modified_mongo: new Date().getTime()
        }}
        this.collection.updateOne(search, query, (err, res) => {
          if (err) throw err
          c++
          if(c === array.length) {
            console.log(this.icon + this.module + ' flickred')
            resolve(true)
          }
        })

      })
    })
  } // flickrNEW

  getflickr(a, b) {
    let select = []
    for (let i = 0; i < a.length; i++) {
      let test = false

      for (var j = 0; j < b.length; j++) {
        if(a[i].title === b[j].name) {
          let added = b[j].added
          if(b[j].added > 1e11) {
            added = Math.floor(b[j].added / 1000)
          }
          const uploaded = parseInt(a[i].dateupload, 10)
          let views_flickr = []
          if(b[j].views_flickr) {
            views_flickr = b[j].views_flickr
          }

          if(added != uploaded || views_flickr.length != a[i].views) {
            a[i].added = added
            if(added > uploaded) {
              a[i].added =  uploaded
            }
            a[i].views_flickr = views_flickr
            if(views_flickr.length != a[i].views) {

              const newViews = a[i].views - views_flickr.length
              const now = Math.floor(new Date().getTime()  / 1000)
              let latest = Math.max(...views_flickr.map(o => o.server))
              if(latest <= 0) {
                latest = a[i].added
              }
              const range = now - latest
              const steps = range / newViews
              for (let k = 0; k < newViews; k++) {
                a[i].views_flickr.push({ server: Math.round(latest + steps + (steps * k)) })
              }

            }
            test = true
          }
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // flickr

  notflickr(a, b) {
    let select = []
    for (let i = 0; i < a.length; i++) {
      let test = true

      for (var j = 0; j < b.length; j++) {
        if(a[i].title === b[j].name) {
          test = false
        }
      }

      if(test) select.push(a[i])
    }
    // console.log(select)
    return select
  } // flickr

  insertNEW(select) {
    console.log(select)

    return new Promise((resolve, reject) => {

      if(select.length === 0) {
        resolve(true)
      }
      let c = 0
      select.forEach((f, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' insert')
        }
        this.metadata(f, (file) => {
          let added = new Date().getTime()
          file.added = Math.floor(added / 1000)
          this.data.push(file)

          // insert mongo
          this.collection.insertOne(file, (err, res) => {
            if (err) throw err
            c++
            if(c === array.length) {
              console.log(this.icon + this.module + ' inserted')
              resolve(true)
            }
          })
        })
      })
    })
  } // insert

  updateNEW(select) {
    console.log(select)

    return new Promise((resolve, reject) => {

      if(select.length === 0) {
        resolve(true)
      }
      let c = 0
      select.forEach((f, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' update')
        }
        this.metadata(f, (file) => {
          //this.change(this.data, file, () => {
          this.fileChange(file)

            // update mongo
            const search = { filename: file.filename }
            const query = { $set: {
              created: file.created,
              time: file.time,
              tags: file.tags,
              added: file.added,
              modified: file.modified,
              modified_mongo: file.modified_mongo,
              display: file.display,
              thumbnail: file.thumbnail,
              orientation: file.orientation,
              _stats: file._stats,
              _exif: file._exif,
            }}
            this.collection.updateOne(search, query, (err, res) => {
              if (err) throw err
              c++
              if(c === array.length) {
                console.log(this.icon + this.module + ' updated')
                resolve(true)
              }
            })


        })
      })
    })
  } // update

  deleteNEW(select) {
    return new Promise((resolve, reject) => {

      if(select.length === 0) {
        resolve(true)
      }
      let c = 0
      select.forEach((file, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' delete')
        }
        this.unlink(this.data, file, () => {
          const query = { filename: file.filename }
          this.collection.deleteOne(query, (err, object) => {
            if (err) throw er
            c++
            if(c === array.length) {
              console.log(this.icon + this.module + ' deleted')
              resolve(true)
            }
          })
        })

      })
    })
  } // delete

  metadata(file, callback) {
    exiftool
      .read(file.path)
      .then((tags) => {

        let created
        let time
        const name = file.filename.replace('.' + tags.FileTypeExtension, '')

        if(tags.DateCreated) {

          created = new Date(tags.DateCreated)
          time = 0
          if(tags.TimeCreated) {
            if(tags.TimeCreated.hour) {
              created.setHours(tags.TimeCreated.hour)
            }
            if(tags.TimeCreated.minute) {
              created.setMinutes(tags.TimeCreated.minute)
            }
            if(tags.TimeCreated.second) {
              created.setSeconds(tags.TimeCreated.second)
            }
            if(tags.TimeCreated.millisecond) {
              created.setMilliseconds(tags.TimeCreated.millisecond)
            }
            time = tags.TimeCreated
          }
          created = created.getTime()
        } else {
          created = new Date(tags.CreateDate)
          created = created.getTime()
          // time =
        }
//      file.filename
//      file.path
//      file.added
//      file.modified
        file.name        = name
        file.created     = created
        file.time        = time
        file.ftp         = true
        file.tags        = tags.Keywords
        file.display     = file.path.replace(file.filename, '') + '.' + this.dsply + '/' + name + this.extension
        file.thumbnail   = file.path.replace(file.filename, '') + '.' + this.thumb + '/' + name + this.extension
        file.orientation = tags.ImageWidth > tags.ImageHeight ? 'landscape' : 'portrait'
//      file._stats
        file._exif       = tags
        this.display(file, () => {
          callback(file)
        })
      })
      .catch(err => console.error(err))
  } // metadata

  display(file, callback) {
    const display = file.display.replace(file.name + this.extension, '');
    if (!fs.existsSync(display)){
      fs.mkdirSync(display)
    }
    const thumbs = file.thumbnail.replace(file.name + this.extension, '');
    if (!fs.existsSync(thumbs)){
      fs.mkdirSync(thumbs)
    }
    const factor = file.orientation === 'portrait' ? 1 : ( file._exif.ImageWidth / file._exif.ImageHeight )
    const dsplyWidth = this.dsplyShort * factor
    const thumbWidth = this.thumbShort * factor
    gm(file.path)
      .resizeExact(dsplyWidth)
      .write(file.display, (err) => {
        if (err) throw err
        gm(file.path)
          .resizeExact(thumbWidth)
          .write(file.thumbnail, (err) => {
            if (err) throw err
            callback()
          })
      })
  } // display

}

module.exports = Mongo
