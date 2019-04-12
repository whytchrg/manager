// *

"use strict"

const Extend   = require('../extend')
const mongodb  = require('mongodb').MongoClient        // MongoDB
const exiftool = require("exiftool-vendored").exiftool // ExifTool


class Mongo extends Extend {

  constructor(options) { // url, db, collection
    super()

    this.data = [] // Database objects to compare
    this.off = []
    this.up = []
    this.change = []

    this.client = new mongodb(options.url, {
      poolSize: 10,
      useNewUrlParser: true,
      connectTimeoutMS: 300000
    })
    this.client.connect(function(err, connect) {
      if (err) throw err
      this.collection = connect.db(options.db).collection(options.collection)
      this.init()
    }.bind(this))

  }

  init() {
    this.collection.find({}).toArray(function(err, data) {
      if (err) throw err
      this.data = data
      this.emit('init') // emit when done
    }.bind(this))
  } // init END!

  evaluate(data) { // add files to MongoDB
    console.log('*** evaluate mongo ***')

    // Delete (unlink this.data) aOnly bOnly aOld
    this.notA(data, this.data, function(select) {
      console.log(' ** ' + select.length + ' files to delete')
      this.delete(select)
    }.bind(this))

    // get up
    let f = 0
    data.forEach(function(file, index, array) {

      if(this.data.length === 0) {
        this.up.push(file)
        f++

      } else {

        let test = false
        let e = 0
        this.data.forEach(function(mongo, i, a) {

          if(file.filename === mongo.filename) {
            test = true
          }

          e++
          if(e === a.length){
            if(!test){
              this.up.push(file)
            }
            f++
          }

        }.bind(this))

      }

      if(f === array.length){
        console.log(this.up.length + ' files to insert')
        // console.log(this.up)
        if(this.up.length > 0)
          this.toMongo()
      }
    }.bind(this)) // up END !!

    // get change
    if(this.data.length === 0) {
      console.log(this.data.length + ' files to change')

    } else {
      let h = 0
      data.forEach(function(file, index, array) {

        let test = false
        let g = 0
        this.data.forEach(function(mongo, i, a) {
          if(file.filename === mongo.filename && file.modified === mongo.modified) {
            test = true
          }
          g++
          if(g === a.length){
            if(!test){
              console.log(file)
              this.change.push(file)
            }
            h++
          }
        }.bind(this))
        if(h === array.length){
          console.log(this.change.length + ' files to change')
          // console.log(this.change)
          if(this.change.length > 0)
            this.changeMongo()
        }
      }.bind(this))
    } // change END !!

  } // Mongo init END !!

  toMongo() {
    console.log('-- insert start')
    this.emit('insert')
    let c = 0
    this.up.forEach(function(up, index, array) {

      this.metadata(up, function(file) {

        this.upData(file)
        this.collection.findOne({ filename: file.filename }, function(err, object) {
          if (err) throw err
          if(!object){
            this.collection.insertOne(file, function(err, res) {
              if (err) throw err

              console.log('inserted: ' + file.filename)
              c++
              if(c === array.length){
                this.up = []
                console.log('-- insert done')
                this.emit('inserted')
              }

            }.bind(this)) // this.collection.insertOne

          }
        }.bind(this)) // this.collection.findOne({ filename: file.filename })

      }.bind(this)) // this.metadata
    }.bind(this)) // this.up.forEach

  } // toMongo END !!

  changeMongo() {
    console.log(' -- mongo update')
    this.emit('update')
    let c = 0
    this.change.forEach(function(change, index, array) {

      this.metadata(change, function(file) {

        this.changeData(file)

        const search = { filename: file.filename }
        const query = { $set: {
          modified: file.modified,
          orientation: file.orientation,
          _stats: file._stats,
          _exif: file._exif
        }}

        this.collection.updateOne(search, query, function(err, res) {
          if (err) throw err

          c++
          if(c === array.length) {
            this.change = []
            console.log(' -- mongo updated')
            this.emit('updated')
          }
        }.bind(this))

      }.bind(this))

    }.bind(this))
  }

  delete(data) {
      let c = 0
      data.forEach(function(file, index, array) {
        if(c === 0) {
          console.log('  * mongo delete')
          this.emit('delete')
        }
        this.unlink(this.data, file, function() {
          const query = { filename: file.filename }
          this.collection.deleteOne(query, function(err, object) {
            if (err) throw er
            c++
            if(c === array.length){
              console.log('  * mongo deleted')
              this.emit('deleted')
            }
          }.bind(this))
        }.bind(this))
      }.bind(this))
  } // delete

  // ---------------------------------------------------------------------------

  metadata(file, callback) {
    exiftool
      .read(file.path)
      .then((tags) => {
        file.display     = file.path.replace(file.filename, '') + '.display/' + file.filename
        file.orientation = tags.ImageWidth > tags.ImageHeight ? 'landscape' : 'portrait'
        file._exif       = tags
        callback(file)
      })
      .catch(err => console.error(err))
  } // assistFile END !!

  upData(file) {
    this.data.push(file)
  } // offData END !!

  changeData(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data[index] = file
      }
    }.bind(this))
  } // offData END !!

  writeDisplay(file){
    const width = file.orientation == 'portrait' ? this.displayWidth : this.displayWidth / ( file._exif.ImageHeight / file._exif.ImageWidth )
    gm(file.path)
      .resizeExact(width)
      .write(file.display, function (err) {
        if (err) throw err
        console.log(file.display + ' added')
      })
  } // writeDisplay END !!

}

module.exports = Mongo
