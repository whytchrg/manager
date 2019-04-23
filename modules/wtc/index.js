
"use strict"

const File  = require('../file')
const Mongo = require('../mongo')
const Ftp   = require('../ftp')
const Mysql = require('../mysql')

class Wtc {

  constructor(options) {

    // Classes
    this.file = new File({ // File
      local: options.local
    })
    this.mongo = new Mongo({ // Mongo
      url:        options.url,
      db:         options.db,
      collection: options.collection
    })
    this.ftp = new Ftp({ // Ftp
      ftphost: options.ftphost,
      ftpport: options.ftpport,
      ftpuser: options.ftpuser,
      ftppass: options.ftppass,
      local:   options.local,
      remote:  options.remote
    })
    this.mysql = new Mysql({ // Mysql
      http:  options.http,
      db:    options.db,
      table: options.collection
    })

    // File Booleans
    this.fileInit      = false
    // Mongo Booleans
    this.mongoInit     = false
    this.mongoEvaluate = false
    // Ftp Booleans
    this.ftpInit       = false
    this.ftpProgress   = false
    // Mysql Booleans
    this.mysqlInit     = false
    this.mysqlProgress = false

    this.init()
  }

  init() {

    // --- --- File Events !!
    this.file.on('init', () => { // init
      this.fileInit = true
      console.log(this.file.data.length + ' files')
      this.evaluateMongo()
    })
    this.file.on('activity', () => { // activity
      this.evaluateMongo()
    })

    // --- --- Mongo Events !!
    this.mongo.on('init', () => { // init
      this.mongoInit = true
      this.evaluateMongo()
    })

    this.mongo.on('evaluate', () => { // evaluate
      this.mongoEvaluate = true
      this.evaluate()
    })

    // --- --- FTP Events !!
    this.ftp.on('init', () => {
      this.ftpInit = true
      this.evaluate()
    })

    this.ftp.on('progress', () => {
      this.ftpProgress = true
    })

    this.ftp.on('done', () => {
      this.ftpProgress = false
      this.evaluate()
    })

    // --- --- Mysql Events !! --- ---

    this.mysql.on('init', () => {
      this.mysqlInit = true
      console.log(this.mysql.data.length + ' mysqls')
      this.evaluate()
    })

    this.mysql.on('progress', () => {
      this.mysqlProgress = true
    })

    this.mysql.on('done', () => {
      this.mysqlProgress = false
      this.evaluate()
    })

  } // init

  evaluateMongo() {

    if(this.fileInit && this.mongoInit) {
      this.mongoEvaluate = false
      // setTimeout(() => {
        this.mongo.evaluate(this.file.data)
      // }, 1)

    }

  } // evaluateMongo

  evaluate() {

    if(this.mongoEvaluate && this.ftpInit && !this.ftpProgress) {
      this.ftp.evaluate(this.mongo.data)
    }

    if(this.mongoEvaluate && this.mysqlInit && !this.mysqlProgress) {
      this.mysql.evaluate(this.mongo.data)
    }

  } // evaluate

}

module.exports = Wtc
