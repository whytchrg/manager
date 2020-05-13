
"use strict"

const Comparison = require('../comparison')
const Display    = require('../display')
const File       = require('../file')
const Flickr     = require('../flickr')
const Html       = require('../html')
const Mongo      = require('../mongo')
const Ftp        = require('../ftp')
const Mysql      = require('../mysql')
const Algorithm  = require('../algorithm')

class Wtc extends Comparison {

  constructor(options) {
    super()

    // Classes
    this.file = new File({ // File
      path: options.path
    })
    this.fileInit = false

    this.mongo = new Mongo({ // Mongo
      path:       options.path,
      display:    options.display,
      thumbnails: options.thumbnails,
      extension:  options.extension,

      url:        options.url,
      db:         options.db,
      collection: options.collection
    })
    this.mongoInit = false

    this.html = new Html({ // Html
      option: 'option'
    })

    this.display = new Display({ // Display
      path:       options.path,
      thumbnails: options.thumbnails,
      extension:  options.extension
    })

    this.ftp = new Ftp({ // Ftp
      path:       options.path,
      remote:     options.remote,
      display:    options.display,
      thumbnails: options.thumbnails,
      extension:  options.extension,

      ftphost: options.ftphost,
      ftpport: options.ftpport,
      ftpuser: options.ftpuser,
      ftppass: options.ftppass
    })
    this.ftpInit     = false
    this.ftpInitUp   = false
    this.ftpProgress = false

    this.flickr = new Flickr({ // Flickr
      userid: options.userid,
      apikey: options.apikey
    })
    this.flickrInit = false

    this.mysql = new Mysql({ // Mysql
      http:  options.http,
      db:    options.db,
      table: options.collection
    })
    this.mysqlInit     = false
    this.mysqlProgress = false

    this.algorithm = new Algorithm() // Algorithm
    this.algorithmEval = false
    // this.progress = false

    // data functionality

    this.dataInit     = false
    this.dataProgress = false

    // algorithm functionality

    this.flickrGot = false
    this.mysqlGot  = false

    this.init()
  }

  init() {
    // --- --- File Events !!
    this.file.on('init', () => { // File init
      setTimeout(() => {
        this.fileInit = true
        this.data()
      }, this.randomInt(10, 100))
    })

    // --- --- Mongo Events !!
    this.mongo.on('init', () => { // Mongo init
      setTimeout(() => {
        this.mongoInit = true
        this.data()
      }, this.randomInt(10, 100));
    })

    // --- --- FTP Events !!
    this.ftp.on('init', () => { // FTP init
      setTimeout(() => {
        this.ftpInit = true
        this.ftpEval()
      }, this.randomInt(10, 100));
    })

    // --- --- Flickr Events !!
    this.flickr.on('init', () => { // Flickr init
      setTimeout(() => {
        this.flickrInit = true
        this.flickrEval()
      }, this.randomInt(10, 100));
    })

    // --- --- Mysql Events !!
    this.mysql.on('init', () => { // Mysql init
      setTimeout(() => {
        this.mysqlInit = true
        this.mysqlInEval()
        this.mysqlUpEval()
      }, this.randomInt(10, 100));
    })

  } // init

  async displayInit() {
    if(this.dataInit) {
      this.display.init(this.mongo.data)
    }
  } // display

  async data() {
    if(this.fileInit && this.mongoInit && !this.dataProgress) {

      console.log('----- data') // Mongo = base

      const newFiles  = this.newFiles(this.mongo.data, this.file.data)    // new Files       | mongo, file   => file
      const oldFiles  = this.oldFiles(this.mongo.data, this.file.data)    // Files to delete | mongo, file   => file
      const modFiles  = this.modFiles(this.mongo.data, this.file.data)    // modified Files  | mongo, file   => file

      if(await Promise.all([newFiles, oldFiles, modFiles])) {
        if(newFiles.length + oldFiles.length + modFiles.length > 0){
          this.dataProgress = true
        }
        const mongoInsert = this.mongo.insert(newFiles)

        const mongoFile = this.mongo.updateFile(modFiles)

        const mongoDelete = this.mongo.delete(oldFiles)

        if(await Promise.all([mongoInsert, mongoFile, mongoDelete])) {
          console.log('----- data √') // Mongo = base
          this.dataInit = true

          this.displayInit()
          this.ftpEval()

          if(this.flickrInit) this.flickrEval()
          if(this.mysqlInit) this.mysqlInEval()

          if(this.dataProgress) {
            this.dataProgress = false
            this.data()
          }
        }
      }
    }
  }

  async ftpEval() {
    if(this.dataInit && this.ftpInit && !this.ftpProgress) {
      console.log('----- ftp') // Mongo = base

      const newFtp = this.newFiles(this.ftp.data, this.mongo.data)      // new Files       | ftp, file => file
      const oldFtp = this.oldFiles(this.ftp.data, this.mongo.data)      // Files to delete | mongo, file   => file
      // const modFtp = this.modFiles(this.ftp.data, this.mongo.data)   // modified Files  | mongo, file   => file

      if(await Promise.all([newFtp, oldFtp])) {
        if(newFtp.length + oldFtp.length> 0){
          this.ftpProgress = true
        }
        const ftpInsert = this.ftp.upload(newFtp)
        // onst ftpFile   = this.ftp.upload(modFtp, 'update')
        const ftpDelete = this.ftp.delete(oldFtp)

        if(await Promise.all([ftpInsert, ftpDelete])) {
          console.log('----- ftp √') // Mongo = base
          this.ftpInitUp = true
          this.mysqlUpEval()

          if(this.ftpProgress) {
            this.ftpProgress = false
            this.ftpEval()
          }

        }

      }

    }
  }

  async flickrEval() {
    if(this.dataInit && this.flickrInit) {
      console.log('----- flickr')
      // this.flickrInit = false

      const modFlickr = await this.modFlickr(this.mongo.data, this.flickr.data) // modified Flickr | mongo, flickr => flickr
      const mongoFlickr = await this.mongo.updateFlickr(modFlickr)

      this.flickrGot = true
      this.compute()
      console.log('----- flickr √')
    }
  }

  async mysqlInEval() {
    if(this.dataInit && this.mysqlInit) {
      console.log('----- mysql IN')
      // this.mysqlInit = false

      const modMysql  = await this.modMysql(this.mongo.data, this.mysql.data)   // modified Mysql  | mongo, mysql  => mysql
      const mongoMysql = await this.mongo.updateMysql(modMysql)

      this.mysqlGot = true
      this.compute()
      console.log('----- mysql IN √')
    }
  }

  async compute() {
    if(this.dataInit && this.flickrGot && this.mysqlGot) {
      console.log('----- algorithm')

      await this.algorithm.rithm(this.mongo.data)
      const modAlgorithm  = this.modAlgorithm(this.mongo.data, this.algorithm.data) // new Algorithm  | mongo, algorithm   => algorithm
      await this.mongo.updateAlgorithm(modAlgorithm)

      // console.log(this.mongo.data[0])

      this.algorithmEval = true
      this.mysqlUpEval()
      console.log('----- algorithm √')
    }
  }

  async mysqlUpEval() {
    if(this.ftpInitUp && this.mysqlInit && this.algorithmEval && !this.mysqlProgress) {
      console.log('----- mysql UP')

      const newMongo = this.newFiles(this.mysql.data, this.mongo.data)   // new Mongo       | mysql, mongo => mongo
      const modMongo = this.modMongo(this.mysql.data, this.mongo.data)   // modified Mongo  | mysql, mongo => mongo
      const oldMongo = this.oldFiles(this.mysql.data, this.mongo.data)    // Files to delete | mongo, file   => file

      if(await Promise.all([newMongo, modMongo, oldMongo])) {
        if(newMongo.length + modMongo.length + oldMongo.length > 0){
          this.mysqlProgress = true
        }
        const mysqlInsert = this.mysql.insert(newMongo)
        const mysqlUpdate = this.mysql.update(modMongo)
        const mysqlDelete = this.mysql.delete(oldMongo)

        if(await Promise.all([mysqlInsert, mysqlUpdate, mysqlDelete])) {
          console.log('----- mysql UP √')

          if(this.mysqlProgress) {
            this.mysqlProgress = false
            this.mysqlUpEval()
          }

        }

      }

    }
  }

  // async insertFile(newFiles, newFtp) {
  //   const mongoInsert = await this.mongo.insert(newFiles)
  //   const ftpInsert = await this.ftp.upload(newFtp)
  //   return true
  // } // insertFile
  //
  // async updateFile(modFiles) {
  //   const mongoFile = await this.mongo.updateFile(modFiles)
  //   const ftpFile = await this.ftp.upload(modFiles, 'update')
  //   return true
  // } // updateFile

} // Wtc

module.exports = Wtc
