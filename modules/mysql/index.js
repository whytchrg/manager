
"use strict"

const Extend  = require('../extend')
const request = require('request')

class Mysql extends Extend {

  constructor(options) { // http, db, collection
    super()
    this.icon = '⧉  -  '
    this.module = this.constructor.name

    // settings
    this.extension = '.png'
    this.dsply = '.display/'
    this.thumb = '.thumbnail/'

    this.httpRequest = {
        url: options.http + "request/",
        method: "POST",
        json: true
    }
    this.httpRequest.body = { client: options.db, table: options.table }

    // Arrays for data, insert, update, delete.
    this.data   = []
    // this.up     = [] //
    this.change = [] // change
    this.off    = [] // remove

    this.init()
  }

  async init() {
    const start = Date.now()

    this.httpRequest.body.request = 'init'
    this.httpRequest.body.data = []

    const raw = await this.mysqlRequest(this.httpRequest)
    await this.dataInit(raw)

    console.log(this.icon + this.countName(this.module, this.data.length)  + ' / ' + (Date.now() - start) / 1000 + ' seconds')
    // console.log(this.data)
    this.emit('init') // emit when done
  } // init

  async insert(mongo) {
    console.log(this.icon + this.countName(this.module, mongo.length) + ' to insert from Mongo')
    // console.log(mongo)
    if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length))

    let data = {}
    for (var i = 0; i < mongo.length; i++) {

      data[i] = await this.makeInsert(mongo[i])

      await this.dataPush(mongo[i])
    }
    // console.log(data)
    const json = await JSON.stringify(data)
    // console.log(json)
    this.httpRequest.body.request = 'insert'
    this.httpRequest.body.data    = json

    await this.mysqlRequest(this.httpRequest)

    if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length) + ' √')
    return true
  } // insert

  delete(select) {
    // if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length))
    //
    // let data = {}
    // for (var i = 0; i < mongo.length; i++) {
    //
    //   data[i] = await this.makeInsert(mongo[i])
    //
    //   await this.dataPush(mongo[i])
    // }
    //
    // const json = await JSON.stringify(data)
    //
    // this.httpRequest.body.request = 'insert'
    // this.httpRequest.body.data    = json
    //
    // await this.mysqlRequest(this.httpRequest)
    //
    // if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length) + ' √')
    // return true

    return new Promise((resolve, reject) => {
      console.log(this.icon + this.countName(this.module, select.length) + ' to delete from Files')
      if(select.length === 0) {
        resolve(true)
      }

      let data = {} // create object with index
      select.forEach(function(file, index, array) {
        if(index === 0) {
          console.log(this.icon + this.module + ' delete')
        }
        this.dataUnlink(file)
        const insert = { filename: file.filename }
        data[index] = insert
      }.bind(this))
      const json = JSON.stringify(data)

      this.httpRequest.body.request = 'delete'
      this.httpRequest.body.data    = json

      request(this.httpRequest, (error, response, body) => {
        if(select.length !== 0) {
          console.log(this.icon + this.module + ' deleted')
          resolve(true)
        }
      })
    })
  } // delete

  // insert(select) {
  //
  //     let data = {}
  //     select.forEach((file, index, array) => {
  //       if(index === 0) {
  //         console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', select.length))
  //         console.log(select)
  //       }
  //       this.data.push(file)
  //       const insert = this.makeInsert(file)
  //       data[index] = insert
  //     })
  //     const json = JSON.stringify(data)
  //
  //     this.httpRequest.body.request = 'insert'
  //     this.httpRequest.body.data    = json
  //
  //     request(this.httpRequest, (error, response, body) =>{
  //       if(select.length !== 0) {
  //         console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', select.length) + ' √')
  //         resolve(true)
  //       }
  //     })
  //   })
  // } // insert

  update(select) {
    // console.log(select)
    return new Promise((resolve, reject) => {
      console.log(this.icon + this.countName(this.module, select.length) + ' to update from Mongo')
      if(select.length === 0) {
        resolve(true)
      }
      let data = {} // create object with index
      for (let i = 0; i < select.length; i++) {
        if(i === 0) {
          console.log(this.icon + this.module + ' update // ' + this.countName('Mongo', select.length))
        }
        this.dataUpdate(select[i])
        const insert = this.makeInsert(select[i])
        // console.log(insert)
        data[i] = insert
      }

      const json = JSON.stringify(data)

      this.httpRequest.body.request = 'update'
      this.httpRequest.body.data    = json

      request(this.httpRequest, (error, response, body) => {
        if(select.length !== 0) {
          console.log(this.icon + this.module + ' update // ' + this.countName('Mongo', select.length) + ' √')
          resolve(true)
        }
      })
    })
  } // delete

  makeInsert(file) {

    return {
      filename: file.filename,
      name: file.filename.split('.').slice(0, -1).join('.'),
      modified: file.modified,
      created: file.created,
      added: file.added,
      views_flickr: JSON.stringify(file.views_flickr),
      tags: JSON.stringify(file.tags).replace(/[\/\(\)\']/g, "\\$&"),
      display: this.dsply + file.filename.split('.').slice(0, -1).join('.') + this.extension,
      thumbnail: this.thumb + file.filename.split('.').slice(0, -1).join('.') + this.extension,
      orientation: file.orientation
    }
  }

  dataUpdate(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data[index] = file
      }
    }.bind(this))
  } // offData END !!

  dataUnlink(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data.splice(index, 1)
      }
    }.bind(this))
  } // offData END !!

  metadata(raw) {

    let file = {
      filename: raw.filename,
      created: parseInt(raw.created, 10),
      added: parseInt(raw.added, 10),
      modified: parseInt(raw.modified, 10),
      orientation: raw.orientation
    }

    let tags = []

    if(typeof raw.tags === 'string' && raw.tags != '') {
      tags = JSON.parse(raw.tags)
    }
    file.tags = tags

    let views = []

    if(typeof raw.views === 'string') {
      const rawView = raw.views.split(';')

      for(let j = 0; j < rawView.length; j++) {
        if(rawView[j].includes('server')){
          let view = JSON.parse(rawView[j])
          view.client = Math.floor(view.client / 1000)
          view.server = parseInt(view.server, 10)
          views.push(view)
        }
      }
    }
    file.views_mysql = views

    let views_flickr = []

    if(typeof raw.views_flickr === 'string') {

      if(raw.views_flickr.includes('server')){
        const rawFlickr = JSON.parse(raw.views_flickr)
        for(let j = 0; j < rawFlickr.length; j++) {

          // console.log(rawFlickr[j])
          let flickr = rawFlickr[j]
          flickr.server = parseInt(flickr.server, 10)
          views_flickr.push(flickr)
        }
      }
    }
    file.views_flickr = views_flickr

    return file
  } // metadata

  // ----- data methods

  dataInit(raw) {
    for(let i = 0; i < raw.length; i++) {
      const data = this.metadata(raw[i])

      this.data.push(data)
    }
    return true
  } // unlink

  // ----- mysql methods

  mysqlRequest(query) {
    return new Promise((resolve, reject) => {
      request(query, (error, response, body) => {

        resolve(JSON.parse(body.data))
      })
    })
  } // request

  // dataInit(raw) {
  //
  //   let data = []
  //
  //   for(let i = 0; i < raw.length; i++) {
  //     let file = {
  //       filename: raw[i].filename,
  //       created: parseInt(raw[i].created, 10),
  //       added: parseInt(raw[i].added, 10),
  //       modified: parseInt(raw[i].modified, 10)
  //     }
  //
  //     let views = []
  //
  //     if(typeof raw[i].views === 'string') {
  //       const rawView = raw[i].views.split(';')
  //
  //       for(let j = 0; j < rawView.length; j++) {
  //         if(rawView[j].includes('server')){
  //           let view = JSON.parse(rawView[j])
  //           view.client = Math.floor(view.client / 1000)
  //           view.server = parseInt(view.server, 10)
  //           views.push(view)
  //         }
  //       }
  //     }
  //     file.views_mysql = views
  //
  //     let views_flickr = []
  //
  //     if(typeof raw[i].views_flickr === 'string') {
  //
  //       if(raw[i].views_flickr.includes('server')){
  //         const rawFlickr = JSON.parse(raw[i].views_flickr)
  //         for(let j = 0; j < rawFlickr.length; j++) {
  //
  //           // console.log(rawFlickr[j])
  //           let flickr = rawFlickr[j]
  //           flickr.server = parseInt(flickr.server, 10)
  //           views_flickr.push(flickr)
  //         }
  //       }
  //     }
  //     file.views_flickr = views_flickr
  //
  //     data.push(file)
  //   }
  //
  //   return data
  // } // dataInit

}

module.exports = Mysql
