
"use strict"

const Extend   = require('../extend')
const mongodb  = require('mongodb').MongoClient
const exiftool = require("exiftool-vendored").exiftool
const gm       = require('gm')
const fs       = require('fs')

class Mongo extends Extend {

  constructor(options) { // url, db, collection
    super()

    this.icon   = '𝕄  -  '
    this.module = this.constructor.name


    // settings
    this.path = options.path
    this.display = options.display
    this.thumbnails = options.thumbnails
    this.extension = options.extension

    this.dsplyShort = 600
    this.thumbShort = 100

    this.collection

    this.data = []

    this.init(options)
  }

  async init(options) {

    await this.mongoConnect(options)
    const raw = await this.mongoAll()

    await this.dataInit(raw)

    console.log(this.icon + this.countName(this.module, this.data.length))
    // console.log(this.data)
    this.emit('init')
  } // init

  async insert(file) {
    console.log(this.icon + this.countName(this.module, file.length) + ' to insert from Files')

    if (file.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('File', file.length))

    for (var i = 0; i < file.length; i++) {
      const data = await this.exif(file[i])

      data.views_flickr = []
      data.views_mysql = []
      data.added = Math.floor(new Date().getTime() / 1000)
      data.modified = new Date().getTime()
      await Promise.all([this.dataPush(data), this.mongoInsert(data), this.preview(data)])
    }

    if (file.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('File', file.length) + ' √')
    return true
  } // insert

  async delete(file) {
    console.log(this.icon + this.countName(this.module, file.length) + ' to delete from Files')
    if (file.length > 0) console.log(this.icon + this.module + ' delete // ' + this.countName('File', file.length))

    for (var i = 0; i < file.length; i++) {
      const data   = file[i]

      const search = { filename: data.filename }

      await this.sleep(10)
      await Promise.all([this.dataUnlink(data), this.mongoDelete(search)])
    }

    if (file.length > 0) console.log(this.icon + this.module + ' delete // ' + this.countName('File', file.length) + ' √')
    return true
  } // delete

  async updateFile(file) {
    console.log(this.icon + this.countName(this.module, file.length) + ' to update from Files')
    if (file.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('File', file.length))

    for (var i = 0; i < file.length; i++) {
      const data   = await this.exif(file[i])

      const search = { filename: data.filename }
      const update = {
        modified: data.modified,
        created: data.created,
        tags: data.tags,
        orientation: data.orientation,
        width: data.width,
        height: data.height
      }
      const query  = { $set: update }

      await this.sleep(10)
      await Promise.all([this.dataFile(data), this.mongoUpdate(search, query), this.preview(data)])
    }

    if (file.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('File', file.length) + ' √')
    return true
  } // updateFile

  async updateFlickr(select) {
    console.log(this.icon + this.countName(this.module, select.length) + ' to update from Flickr')
    if (select.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('Flickr', select.length))

    for (var i = 0; i < select.length; i++) {
      const file   = select[i]

      const search = { filename: file.filename }
      const update = {
        added: file.added,
        views_flickr: file.views_flickr,
      }
      const query = { $set: update }

      await Promise.all([this.dataFlickr(file), this.mongoUpdate(search, query)])
    }

    if (select.length > 0) console.log(this.icon + this.module + ' updated // ' + this.countName('Flickr', select.length) + ' √')
    return true
  } // flickr

  async updateMysql(select) {
    console.log(this.icon + this.countName(this.module, select.length) + ' to update from Mysql')
    if (select.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('Mysql', select.length))

    for (var i = 0; i < select.length; i++) {
      const file   = select[i]

      const search = { filename: file.filename }
      const update = {
        views_mysql: file.views_mysql
      }
      const query = { $set: update }

      await Promise.all([this.dataMysql(file), this.mongoUpdate(search, query)])
    }

    if (select.length > 0) console.log(this.icon + this.module + ' updated // ' + this.countName('Mysql', select.length) + ' √')
    return true
  } // updateMysql

  //

  metadata(raw) {

    if(!Array.isArray(raw.views_flickr)) {
      raw.views_flickr = []
    }

    if(!Array.isArray(raw.views_mysql)) {
      raw.views_mysql = []
    }

    let added = raw.added
    if(raw.added > 1e11) {
      added = Math.floor(raw.added / 1000)
    }

    const data = {
      filename:     raw.filename,
      created:      raw.created,
      modified:     raw.modified,
      added: added,
      views_flickr: raw.views_flickr,
      views_mysql: raw.views_mysql,
      tags: raw.tags,
      orientation: raw.orientation,
      width: raw.width,
      height: raw.height
    }

    return data
  } // metadata

  exif(data) {
    return new Promise((resolve, reject) => {

      exiftool
        .read(this.path + data.filename)
        .then((tags) => {

          let created
          let offset = 0

          console.log(tags)

          if(tags.DateTimeCreated) {
            created = new Date(tags.DateTimeCreated)

            // if(tags.DateTimeCreated.tzoffsetMinutes === 0) {
            //   offset = created.getTimezoneOffset()
            // } else if(tags.DateTimeCreated.tzoffsetMinutes) {
            //   offset = tags.DateTimeCreated.tzoffsetMinutes
            // }

            // created = created.getTime()
          } else if(tags.DateCreated) {
            created = new Date(tags.DateCreated)

            if(tags.TimeCreated) {
              if(tags.TimeCreated.hour)        created.setHours(tags.TimeCreated.hour)
              if(tags.TimeCreated.minute)      created.setMinutes(tags.TimeCreated.minute)
              if(tags.TimeCreated.second)      created.setSeconds(tags.TimeCreated.second)
              if(tags.TimeCreated.millisecond) created.setMilliseconds(tags.TimeCreated.millisecond)
            }

            offset = created.getTimezoneOffset()

            // created = created.getTime() + created.getTimezoneOffset() * 60000
          } else {
            created = new Date(tags.CreateDate)
            offset = created.getTimezoneOffset()

            // created = created.getTime() + created.getTimezoneOffset() * 60000
          }

          console.log(offset)
          created = created.getTime() + offset * 60000

          data.created     = created
          data.tags        = tags.Keywords
          data.orientation = tags.ImageWidth > tags.ImageHeight ? 'landscape' : 'portrait'
          data.width       = tags.ImageWidth
          data.height      = tags.ImageHeight

          resolve(data)
        })
        .catch(err => console.error(err))

    })
  } // exif

  async preview(data) {

    const display = this.previewImage(data, this.dsplyShort, this.display)

    const thumbnail = this.previewImage(data, this.thumbShort, this.thumbnails)

    await Promise.all([display, thumbnail])

    return true

  } // preview

  previewImage(data, short, directory) {
    return new Promise((resolve, reject) => {

      const factor = data.orientation === 'portrait' ? 1 : ( data.width / data.height )
      const width = short * factor
      const preview = data.filename.split('.').slice(0, -1).join('.') + this.extension

      const display = this.path + directory
      if (!fs.existsSync(display)){
        fs.mkdirSync(display)
      }

      gm(this.path + data.filename)
        .resizeExact(width)
        .write(display + '/' + preview, (err) => {
          if (err) throw err
          resolve(true)
        })

    })
  } // previewImage

  // ----- data methods

  dataInit(raw) {
    for(let i = 0; i < raw.length; i++) {
      const data = this.metadata(raw[i])

      this.data.push(data)
    }
    return true
  } // unlink

  dataFile(data) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === data.filename) {

        this.data[i].modified    = data.modified

        this.data[i].created     = data.created
        this.data[i].tags        = data.tags
        this.data[i].orientation = data.orientation
        this.data[i].width       = data.width
        this.data[i].height      = data.height

        return true
      }
    }
  } // dataFile

  dataFlickr(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {

        this.data[i].added = file.added
        this.data[i].views_flickr = file.views_flickr

        return true
      }
    }
  } // dataFlickr

  dataMysql(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {

        this.data[i].views_mysql = file.views_mysql

        return true
      }
    }
  } // dataMysql

  // ----- mongodb methods

  mongoConnect(options) {
    return new Promise((resolve, reject) => {

      const client = new mongodb(options.url, {
        poolSize: 10,
        useNewUrlParser: true,
        connectTimeoutMS: 300000
      })

      client.connect((err, connect) => {
        if (err) throw err

        this.collection = connect.db(options.db).collection(options.collection)
        resolve(true)
      })
    })
  } // mongoConnect

  mongoAll() {
    return new Promise((resolve, reject) => {

      this.collection.find().toArray((err, data) => {
        if (err) throw err

        resolve(data)
      })
    })
  } // mongoAll

  mongoInsert(data) {
    return new Promise((resolve, reject) => {

      this.collection.insertOne(data, (err, res) => {
        if (err) throw err

        resolve(true)
      })
    })
  } // mongoInsert

  mongoDelete(search) {
    return new Promise((resolve, reject) => {

      this.collection.deleteOne(search, (err, object) => {
        if (err) throw er

        resolve(true)
      })
    })
  } // mongoDelete

  mongoUpdate(search, query) {
    return new Promise((resolve, reject) => {

      this.collection.updateOne(search, query, (err, res) => {
        if (err) throw err

        resolve(true)
      })
    })
  } // mongoUpdate

}

module.exports = Mongo
