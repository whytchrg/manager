
"use strict"

const File  = require('../file')
const Mongo = require('../mongo')

class Wtc {

  constructor(options) {

    this.file = new File({
      local: options.local
    })
    this.mongo = new Mongo({
      url:        options.url,
      db:         options.db,
      collection: options.collection
    })
    // Booleans
    this.fileInit      = false
    this.mongoInit     = false
    this.mongoProgress = false
    this.mongoInsert   = false
    this.mongoUpdate   = false
    this.mongoDelete   = false

    this.init()
  }

  init() {

    // --- --- File Events !!
    this.file.on('init', () => {
      this.fileInit = true
      console.log(this.file.data.length + ' files')
      this.evaluate()
    })
    this.file.on('add', () => {
      this.evaluate()
    })
    this.file.on('change', () => {
      this.evaluate()
    })
    this.file.on('unlink', () => {
      this.evaluate()
    })

    // --- --- Mongo Events !!
    this.mongo.on('init', () => { // --- init
      this.mongoInit = true
      console.log(this.mongo.data.length + ' mongos')
      this.evaluate()
    })
    this.mongo.on('insert', () => { // --- insert
      this.mongoProgress = true
      this.mongoInsert   = true
    })
    this.mongo.on('inserted', () => {
      this.mongoInsert   = false
      if(!this.mongoInsert && !this.mongoUpdate && !this.mongoDelete) {
        this.mongoProgress = false
        this.evaluate()
      }
    })
    this.mongo.on('update', () => { // update
      this.mongoProgress = true
      this.mongoUpdate   = true
    })
    this.mongo.on('updated', () => {
      this.mongoUpdate   = false
      if(!this.mongoInsert && !this.mongoUpdate && !this.mongoDelete) {
        this.mongoProgress = false
        this.evaluate()
      }
    })
    this.mongo.on('delete', () => { // delete
      this.mongoProgress = true
      this.mongoDelete   = true
    })
    this.mongo.on('deleted', () => {
      this.mongoDelete   = false
      if(!this.mongoInsert && !this.mongoUpdate && !this.mongoDelete) {
        this.mongoProgress = false
        this.evaluate()
      }
    })

  } // init

  evaluate() {

    // Mongo init
    if(this.fileInit && this.mongoInit && !this.mongoProgress) {
      this.mongo.evaluate(this.file.data)
    }

  } // evaluate

}

module.exports = Wtc
