
"use strict"

const Comparison = require('../comparison')
// const Display    = require('../display')
const File       = require('../file')
const Flickr     = require('../flickr')
// const Html       = require('../html')
const Mongo      = require('../mongo')
const Ftp        = require('../ftp')
const Mysql      = require('../mysql')
const Algorithm  = require('../algorithm')

class Wtc extends Comparison {

  constructor(options) {
    super()

    // Classes

    this.file = new File({
      path: options.path
    })
    this.fileInit = false

    this.mongo = new Mongo({
      path:       options.path,
      display:    options.display,
      thumbnails: options.thumbnails,
      extension:  options.extension,

      url:        options.url,
      db:         options.db,
      collection: options.collection
    })
    this.mongoInit = false

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

    // data functionality

    this.dataInit     = false
    this.dataProgress = false

    // algorithm functionality

    this.flickrGot = false
    this.mysqlGot  = false

  }

  init() {
    this.file.init()
    this.mongo.init()
    this.ftp.init()
    this.mysql.init()

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
        this.flickrIn()
      }, this.randomInt(10, 100));
    })

    // --- --- Mysql Events !!
    this.mysql.on('init', () => { // Mysql init
      setTimeout(() => {
        this.mysqlInit = true
        this.mysqlIn()
        this.mysqlUp()
      }, this.randomInt(10, 100));
    })

  } // init

  display() {
    this.emit('display', this.mongo.data)
  } // display

  async data() {
    if(this.fileInit && this.mongoInit && !this.dataProgress) {
      console.log('----- data') // Mongo = base

      const newFiles = this.newFiles(this.mongo.data, this.file.data)    // new Files       | mongo, file   => file
      const oldFiles = this.oldFiles(this.mongo.data, this.file.data)    // Files to delete | mongo, file   => file
      const modFiles = this.modFiles(this.mongo.data, this.file.data)    // modified Files  | mongo, file   => file

      await Promise.all([newFiles, oldFiles, modFiles])

      if(newFiles.length + oldFiles.length + modFiles.length > 0) this.dataProgress = true

      await Promise.all([this.mongo.insert(newFiles), this.mongo.updateFile(modFiles), this.mongo.delete(oldFiles)])

      const analysis = await this.mongo.analyse()
      await this.mongo.updateAnalysis(analysis)

      this.dataInit = true
      console.log('----- data √') // Mongo = base

      this.display()
      this.flickrIn()
      this.mysqlIn()

      if(this.dataProgress) {
        this.dataProgress = false
        this.data()
      }
    }
  } // data

  async flickrIn() {
    if(this.dataInit && this.flickrInit) {
      console.log('----- flickr')
      // this.flickrInit = false

      const modFlickr = await this.modFlickr(this.mongo.data, this.flickr.data) // modified Flickr | mongo, flickr => flickr
      const mongoFlickr = await this.mongo.updateFlickr(modFlickr)

      this.flickrGot = true
      console.log('----- flickr √')
      this.compute()
    }
  } // flickrIn

  async mysqlIn() {
    if(this.dataInit && this.mysqlInit) {
      console.log('----- mysql IN')
      // this.mysqlInit = false

      const modMysql  = await this.modMysql(this.mongo.data, this.mysql.data)   // modified Mysql  | mongo, mysql  => mysql
      const mongoMysql = await this.mongo.updateMysql(modMysql)

      this.mysqlGot = true
      console.log('----- mysql IN √')
      this.compute()
    }
  } // mysqlIn

  async compute() {
    if(this.dataInit && this.flickrGot && this.mysqlGot) {
      console.log('----- algorithm')
      this.flickrGot = false
      this.mysqlGot = false

      await this.algorithm.rithm(this.mongo.data)
      const modAlgorithm = this.modAlgorithm(this.mongo.data, this.algorithm.data) // new Algorithm  | mongo, algorithm   => algorithm
      await this.mongo.updateAlgorithm(await modAlgorithm)

      this.algorithmEval = true
      console.log('----- algorithm √')
      this.ftpEval()
    }
  } // compute

  async ftpEval() {
    if(this.dataInit && this.ftpInit && !this.ftpProgress) {
      console.log('----- ftp')

      const newFtp = this.newFiles(this.ftp.data, this.mongo.data)      // new Files       | ftp, file => file
      const oldFtp = this.oldFiles(this.ftp.data, this.mongo.data)      // Files to delete | mongo, file   => file

      await Promise.all([newFtp, oldFtp])
      if(newFtp.length + oldFtp.length> 0) this.ftpProgress = true

      await Promise.all([this.ftp.upload(newFtp), this.ftp.delete(oldFtp)])
      this.ftpInitUp = true
      console.log('----- ftp √')

      this.mysqlUp()

      if(this.ftpProgress) {
        this.ftpProgress = false
        this.ftpEval()
      }
    }
  } // ftpEval

  async mysqlUp() {
    if(this.mysqlInit && this.algorithmEval && this.ftpInitUp && !this.mysqlProgress) {
      console.log('----- mysql UP')
      this.algorithmEval = false
      this.ftpInitUp = false

      const newMongo = this.newFiles(this.mysql.data, this.mongo.data)   // new Mongo       | mysql, mongo => mongo
      const modMongo = this.modMongo(this.mysql.data, this.mongo.data)   // modified Mongo  | mysql, mongo => mongo
      const oldMongo = this.oldFiles(this.mysql.data, this.mongo.data)    // Files to delete | mongo, file   => file

      await Promise.all([newMongo, modMongo, oldMongo])
      if(newMongo.length + modMongo.length + oldMongo.length > 0) this.mysqlProgress = true

      await Promise.all([this.mysql.insert(newMongo), this.mysql.update(modMongo), this.mysql.delete(oldMongo)])
      console.log('----- mysql UP √')

      if(this.mysqlProgress) {
        this.mysqlProgress = false
        this.mysqlUp()
      }
    }
  } // mysqlUp

} // Wtc

module.exports = Wtc
