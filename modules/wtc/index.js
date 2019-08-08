
"use strict"

const Analysis   = require('../analysis')
const Comparison = require('../comparison')
const Display    = require('../display')
const File       = require('../file')
const Flickr     = require('../flickr')
const Html       = require('../html')
const Mongo      = require('../mongo')
const Ftp        = require('../ftp')
const Mysql      = require('../mysql')

console.log(Object.getOwnPropertyNames(Analysis))

console.log(Analysis.color('../A5/.thumbnail/arw18_05_879.png'))

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
    this.ftpInit = false

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
    this.mysqlInit = false

    this.progress = false

    this.init()
  }

  init() {
    // --- --- File Events !!
    this.file.on('init', () => { // File init
      setTimeout(() => {
        this.fileInit = true
        this.evaluate()
      }, this.randomInt(10, 100))
    })

    // --- --- Mongo Events !!
    this.mongo.on('init', () => { // Mongo init
      setTimeout(() => {
        this.mongoInit = true
        this.displayInit()
        this.evaluate()
      }, this.randomInt(10, 100));
    })

    // --- --- FTP Events !!
    this.ftp.on('init', () => { // FTP init
      setTimeout(() => {
        this.ftpInit = true
        this.evaluate()
      }, this.randomInt(10, 100));
    })

    // --- --- Flickr Events !!
    this.flickr.on('init', () => { // Flickr init
      setTimeout(() => {
        this.flickrInit = true
        this.evaluate()
      }, this.randomInt(10, 100));
    })

    // --- --- Mysql Events !!
    this.mysql.on('init', () => { // Mysql init
      setTimeout(() => {
        this.mysqlInit = true
        this.evaluate()
      }, this.randomInt(10, 100));
    })

  } // init

  async displayInit() {
    if(this.mongoInit) {
      this.display.init(this.mongo.data)
    }
  } // display

  async data() {
    if(this.fileInit && this.mongoInit) {
      const newFiles  = this.newFiles(this.mongo.data, this.file.data)    // new Files       | mongo, file   => file
      const oldFiles  = this.oldFiles(this.mongo.data, this.file.data)    // Files to delete | mongo, file   => file
      const modFiles  = this.modFiles(this.mongo.data, this.file.data)    // modified Files  | mongo, file   => file
  
    }
  }

  async evaluate() {

    if(this.fileInit && this.mongoInit && this.ftpInit && this.flickrInit && this.mysqlInit && !this.progress) {

      console.log('-----') // Mongo = base

      const newFiles  = this.newFiles(this.mongo.data, this.file.data)    // new Files       | mongo, file   => file
      const oldFiles  = this.oldFiles(this.mongo.data, this.file.data)    // Files to delete | mongo, file   => file
      const modFiles  = this.modFiles(this.mongo.data, this.file.data)    // modified Files  | mongo, file   => file

      const modFlickr = this.modFlickr(this.mongo.data, this.flickr.data) // modified Flickr | mongo, flickr => flickr
      const modMysql  = this.modMysql(this.mongo.data, this.mysql.data)   // modified Mysql  | mongo, mysql  => mysql

      const newFtp    = this.newFiles(this.ftp.data, this.file.data)      // new Files       | ftp, file => file

      const newMongo  = this.newFiles(this.mysql.data, this.mongo.data)   // new Mongo       | mysql, mongo => mongo
      const modMongo  = this.modMongo(this.mysql.data, this.mongo.data)   // modified Mongo  | mysql, mongo => mongo

      if(await Promise.all([newFiles, oldFiles, modFiles, modFlickr, modMysql, newFtp, newMongo, modMongo])) {
        if(newFiles.length + oldFiles.length + modFiles.length + modMysql.length + newFtp.length + newMongo.length + modMongo.length > 0){
          this.progress = true
        }

        const insertFile = this.insertFile(newFiles, newFtp)

        const mongoDelete = this.mongo.delete(oldFiles)

        const updateFile = this.updateFile(modFiles)

        const mongoFlickr = this.mongo.updateFlickr(modFlickr)

        const mongoMysql = this.mongo.updateMysql(modMysql)

        const ftpDelete = this.ftp.delete(oldFiles)

        const mysqlInsert = this.mysql.insert(newMongo)

        const mysqlUpdate = this.mysql.update(modMongo)

        const mysqlDelete = this.mysql.delete(oldFiles)

        if(await Promise.all([insertFile, mongoDelete, updateFile, mongoMysql, ftpDelete, mysqlInsert, mysqlUpdate, mysqlDelete])) {
          if(this.progress) {
            this.progress = false
            this.evaluate()
            this.displayInit()
          }
        }
      }
    }

  } // evaluate

  async insertFile(newFiles, newFtp) {
    const mongoInsert = await this.mongo.insert(newFiles)
    const ftpInsert = await this.ftp.upload(newFtp)
    return true
  } // insertFile

  async updateFile(modFiles) {
    const mongoFile = await this.mongo.updateFile(modFiles)
    const ftpFile = await this.ftp.upload(modFiles, 'update')
    return true
  } // updateFile

} // Wtc

module.exports = Wtc
