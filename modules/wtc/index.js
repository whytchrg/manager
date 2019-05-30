
"use strict"

const Comparison = require('../comparison')
const File       = require('../file')
const Flickr     = require('../flickr')
const Mongo      = require('../mongo')
const Ftp        = require('../ftp')
const Mysql      = require('../mysql')

class Wtc extends Comparison {

  constructor(options) {
    super()
    // Classes
    this.file = new File({
      local: options.local
    })
    this.fileInit = false

    this.flickr = new Flickr({ // Flickr
      userid: options.userid,
      apikey: options.apikey
    })
    this.flickrInit = false

    this.mongo = new Mongo({ // Mongo
      url:        options.url,
      db:         options.db,
      collection: options.collection
    })

    this.mysql = new Mysql({ // Mysql
      http:  options.http,
      db:    options.db,
      table: options.collection
    })

    this.ftp = new Ftp({ // Ftp
      ftphost: options.ftphost,
      ftpport: options.ftpport,
      ftpuser: options.ftpuser,
      ftppass: options.ftppass,
      local:   options.local,
      remote:  options.remote
    })


    // File Booleans

    // Flickr Booleans

    // Mongo Booleans
    this.mongoInit     = false
    this.mongoProgress = false
    // Mysql Booleans
    this.mysqlInit     = false
    this.mysqlProgress = false
    // Ftp Booleans
    this.ftpInit       = false
    this.ftpProgress   = false

    this.progress = false

    this.init()
  }

  init() {

    // --- --- File Events !!
    this.file.on('init', () => { // File init
      this.fileInit = true
      this.evaluate()
      this.eval()
    })

    // --- --- Flickr Events !!
    this.flickr.on('init', () => { // Flickr init
      this.flickrInit = true
      this.evaluate()
      this.eval()
    })

    // --- --- Mongo Events !!
    this.mongo.on('init', () => { // Mongo init
      this.mongoInit = true
      this.evaluate()
      this.eval()
    })

    this.mongo.on('progress', () => {
      this.mongoProgress = true
    })

    this.mongo.on('done', () => {
      this.mongoProgress = false
      this.evaluate()
    })

    // --- --- Mysql Events !!
    this.mysql.on('init', () => { // Mysql init
      this.mysqlInit = true
      this.evaluate()
      this.eval()
    })

    this.mysql.on('progress', () => {
      this.mysqlProgress = true
    })

    this.mysql.on('done', () => {
      this.mysqlProgress = false
      this.evaluate()
    })

    // --- --- FTP Events !!
    this.ftp.on('init', () => { // FTP init
      this.ftpInit = true
      this.evaluate()
      this.eval()
    })

    this.ftp.on('progress', () => {
      this.ftpProgress = true
    })

    this.ftp.on('done', () => {
      this.ftpProgress = false
      this.evaluate()
    })

  } // init

  async evaluate() {

    if(this.fileInit && this.flickrInit && this.mongoInit && this.mysqlInit && this.ftpInit && !this.mongoProgress && !this.ftpProgress && !this.mysqlProgress) {
      const a = await this.mongo.evaluate(this.file.data, this.flickr.data, this.mysql.data)
      const b = await this.ftp.evaluate(this.mongo.data)
      const c = await this.mysql.evaluate(this.mongo.data)
    }

  } // evaluate

  async eval() {

    if(this.fileInit && this.flickrInit && this.mongoInit && this.mysqlInit && this.ftpInit && !this.progress) {

      const a = this.newFiles(this.file.data, this.mongo.data)
      const b = this.modFiles(this.file.data, this.mongo.data)
      const c = this.oldFiles(this.file.data, this.mongo.data)
      const f = this.getflickr(this.flickr.data, this.mongo.data)
      const m = this.getmysql(this.mysql.data, this.mongo.data)

      if(await a && await b && await c && await f && await m){

        if(a.length + b.length + c.length + f.length + m.length > 0){
          this.progress = true

        }
        console.log('A')
        console.log(a)
        console.log('B')
        console.log(b)
        console.log('C')
        console.log(c)
        console.log('F')
        console.log(f)
        console.log('M')
        console.log(m)
        console.log(this.mongo.icon + this.mongo.log(this.mongo.module, a.length) + ' to insert from Files')
        //const i = this.insertNEW(a)

        console.log(this.mongo.icon + this.mongo.log(this.mongo.module, b.length) + ' to update from Files')
        //const u = this.updateNEW(b)

        console.log(this.mongo.icon + this.mongo.log(this.mongo.module, c.length) + ' to delete from Files')
        //const d = this.deleteNEW(c)

        console.log(this.mongo.icon + this.mongo.log(this.mongo.module, f.length) + ' to update from Flickr')
        //const r = this.flickrNEW(f)

        console.log(this.mongo.icon + this.mongo.log(this.mongo.module, m.length) + ' to update from Mysql')
        //const s = this.mysqlNEW(m)

        // if(await i && await u && await d && await r && await s){
        //   if(this.progress) {
        //     this.progress = false
        //   }
        // }
      }
    }

  } // eval

  // async eval() {
  //
  //   if(this.fileInit && this.flickrInit && this.mongoInit && !this.mongoEvaluate) {
  //     await this.mongo.file(this.file.data)
  //     await this.mongo.flickr(this.flickr.data)
  //   }
  //
  // } // eval
  //
  // evaluate() {
  //
  //   if(this.mongoEvaluate && this.ftpInit && !this.ftpProgress) {
  //     this.ftp.evaluate(this.mongo.data)
  //   }
  //
  //   if(this.mongoEvaluate && this.mysqlInit && !this.mysqlProgress) {
  //     this.mysql.evaluate(this.mongo.data)
  //   }
  //
  // } // evaluate

}

module.exports = Wtc
