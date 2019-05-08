
"use strict"

const Extend   = require('../extend')
const mongodb  = require('mongodb').MongoClient
const exiftool = require("exiftool-vendored").exiftool
const gm       = require('gm')
const fs       = require('fs')

class Mongo extends Extend {

  constructor(options) { // url, db, collection
    super()
    this.lgmk = '⋑ '
    this.name = this.constructor.name

    // settings
    this.extension = '.png'
    this.dsplyShort = 600
    this.thumbShort = 100
    this.dsply = 'display'
    this.thumb = 'thumbnail'

    this.data = []
    // this.activity = { progress: false }

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
        console.log(this.lgmk + this.log_name(this.name, this.data.length))
        this.emit('init')
      })
    })

    let insert = false
    let update = false
    let remove = false

    this.on('insert', () => {
      insert = true
    })
    this.on('inserted', () => {
      insert = false
      this.progress(insert, update, remove)
    })
    this.on('update', () => {
      update = true
    })
    this.on('updated', () => {
      update = false
      this.progress(insert, update, remove)
    })
    this.on('delete', () => {
      remove = true
    })
    this.on('deleted', () => {
      remove = false
      this.progress(insert, update, remove)
    })

  } // init

  progress(insert, update, remove) {
    if(!insert && !update && !remove) {
      // this.activity.progress = false
      this.emit('evaluate')
    } else {
      // this.activity.progress = true
    }
  }

  file(file, flickr) {
    console.log(this.lgmk + 'evaluate ' + this.name)

    this.getNew(file, this.data, (select) => {
      console.log(this.lgmk + this.log_name(this.name, select.length) + ' to insert')
      this.insert(select)
    })

    this.getChanged(file, this.data, (select) => {
      console.log(this.lgmk + this.log_name(this.name, select.length) + ' to update')
      this.update(select)
    })

    this.getDeleted(file, this.data, (select) => {
      console.log(this.lgmk + this.log_name(this.name, select.length) + ' to delete')
      this.delete(select)
    })

  } // evaluate

  insert(select) {
    if(select.length === 0) {
      // this.emit('insert')
      setTimeout(() => { this.emit('inserted') }, 1)
    }
    let c = 0
    select.forEach((f, index, array) => {
      if(index === 0) {
        console.log(this.lgmk + this.name + ' insert')
        this.emit('insert')
      }
      this.metadata(f, (file) => {
        file.added = new Date().getTime()
        this.data.push(file)

        // insert mongo
        this.collection.insertOne(file, (err, res) => {
          if (err) throw err
          c++
          if(c === array.length) {
            console.log(this.lgmk + this.name + ' inserted')
            this.emit('inserted')
          }
        })

      })
    })
  } // insert

  update(select) {
    if(select.length === 0) {
      // this.emit('update')
      setTimeout(() => { this.emit('updated') }, 1)
    }
    let c = 0
    select.forEach((f, index, array) => {
      if(index === 0) {
        console.log(this.lgmk + this.name + ' update')
        this.emit('update')
      }
      this.metadata(f, (file) => {
        this.change(this.data, file, () => {

          // update mongo
          const search = { filename: file.filename }
          const query = { $set: {
            created: file.created,
            time: file.time,
            tags: file.tags,
            added: file.added,
            modified: file.modified,
            display: file.display,
            thumbnail: file.thumbnail,
            orientation: file.orientation,
            _stats: file._stats,
            _exif: file._exif,
            ftp: file.ftp
          }}
          this.collection.updateOne(search, query, (err, res) => {
            if (err) throw err
            c++
            if(c === array.length) {
              console.log(this.lgmk + this.name + ' updated')
              this.emit('updated')
            }
          })

        })
      })
    })
  } // update

  delete(select) {
    if(select.length === 0) {
      // this.emit('delete')
      setTimeout(() => { this.emit('deleted') }, 1)
    }
    let c = 0
    select.forEach((file, index, array) => {
      if(index === 0) {
        console.log(this.lgmk + this.name + ' delete')
        this.emit('delete')
      }

      // unlink mongo
      this.unlink(this.data, file, () => {
        const query = { filename: file.filename }
        this.collection.deleteOne(query, (err, object) => {
          if (err) throw er
          c++
          if(c === array.length) {
            console.log(this.lgmk + this.name + ' deleted')
            this.emit('deleted')
          }
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
          if(tags.TimeCreated) {
            created.setHours(tags.TimeCreated.hour, tags.TimeCreated.minute, tags.TimeCreated.second, tags.TimeCreated.millisecond)
            created = created.getTime()
            time = tags.TimeCreated
          }
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

  log_name(name, n) {
    return (n === 1 ? n + ' ' + name : n + ' ' + name + 's');
  }

}

module.exports = Mongo
