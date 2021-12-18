
"use strict"

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Extend  = require('../extend')
// const request = require('request')

class Mysql extends Extend {

  constructor(options) { // http, db, collection
    super()
    this.icon = '⧉  -  '
    this.module = this.constructor.name

    // settings
    this.extension = '.png'
    this.dsply = '.display/'
    this.thumb = '.thumbnail/'

    this.url = options.http

    this.message = { client: options.db, table: options.table }

    this.data  = []

  }

  async init() {
    const start = Date.now()

    this.message.request = 'init'
    this.message.data = []

    const raw = await this.request(this.message)
    // console.log(raw)
    await this.dataInit(raw)

    console.log(this.icon + this.countName(this.module, this.data.length)  + ' / ' + (Date.now() - start) / 1000 + ' seconds')
    this.emit('init') // emit when done
  } // init

  async insert(mongo) {
    console.log(this.icon + this.countName(this.module, mongo.length) + ' to insert from Mongo')
    if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length))

    let data = {}
    for (var i = 0; i < mongo.length; i++) {

      data[i] = await this.makeInsert(mongo[i])
      await this.dataPush(mongo[i])
    }
    const json = await JSON.stringify(data)
    this.message.request = 'insert'
    this.message.data    = json

    await this.request(this.message)

    if (mongo.length > 0) console.log(this.icon + this.module + ' insert // ' + this.countName('Mongo', mongo.length) + ' √')
    return true
  } // insert

  async update(select) {
    // console.log(select)
    // return new Promise((resolve, reject) => {
    console.log(this.icon + this.countName(this.module, select.length) + ' to update from Mongo')
    if (select.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('Mongo', select.length))

    let data = {} // create object with index
    let count = 50
    if(select.length < 50) count = select.length
    for (let i = 0; i < select.length; i++) {

      data[i]= await this.makeInsert(select[i])
      await this.dataUpdate(select[i])
    }

    // console.log(data[0])

    const json = await JSON.stringify(data)
    this.message.request = 'update'
    this.message.data    = json

    await this.request(this.message)

    if (select.length > 0) console.log(this.icon + this.module + ' update // ' + this.countName('Mongo', select.length) + ' √')
    return true
    // })
  } // update

  async delete(select) {

    console.log(this.icon + this.countName(this.module, select.length) + ' to delete from Files')

    if(select.length > 0) {

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

      this.message.request = 'delete'
      this.message.data    = json
      await this.request(this.message)

      console.log(this.icon + this.module + ' delete // ' + this.countName('Mysql', select.length) + ' √')
    }

    return true
  } // delete

  check() {

  } // check

  makeInsert(file) {

    return {
      filename: file.filename,
      name: file.filename.split('.').slice(0, -1).join('.'),
      created: file.created,
      algorithm: file.algorithm,
      tags: JSON.stringify(file.tags).replace(/[\/\(\)\']/g, "\\$&"),
      display: this.dsply + file.filename.split('.').slice(0, -1).join('.') + this.extension,
      thumbnail: this.thumb + file.filename.split('.').slice(0, -1).join('.') + this.extension,
      orientation: file.orientation,
      description: file.description
    }
  } // makeInsert

  dataUpdate(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data[index] = file
      }
    }.bind(this))
  } // dataUpdate

  dataUnlink(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data.splice(index, 1)
      }
    }.bind(this))
  } // dataUnlink

  metadata(raw) {

    let file = {
      filename: raw.filename,
      created: parseInt(raw.created, 10),
      algorithm: parseFloat(raw.algorithm),
      orientation: raw.orientation,
      description: raw.description
    }

    let tags = []

    if(typeof raw.tags === 'string' && raw.tags != '') {
      // console.log(raw.tags)
      const newString = raw.tags.replace(/\\'/, "'");
      // console.log(newString)
      tags = JSON.parse(newString)
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

    return file
  } // metadata

  // ----- data methods

  dataInit(raw) {
    for(let i = 0; i < raw.length; i++) {
      const data = this.metadata(raw[i])

      this.data.push(data)
    }
    return true
  } // dataInit

  // ----- mysql methods

request(request) {
  return new Promise((resolve, reject) => {

    const json = JSON.stringify(request)
    let xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = () => {
      if (xhttp.readyState == 4 && xhttp.status == 200) {

        const response = JSON.parse(JSON.parse(xhttp.responseText).data)

        resolve(response)
      }
    }
    xhttp.open("POST", this.url + "request.php", true) // change url here
    xhttp.setRequestHeader("Content-Type", "application/json")
    xhttp.send(json)
  })
} // request

  // mysqlRequest(query) {
  //   return new Promise((resolve, reject) => {
  //     request(query, (error, response, body) => {
  //       // console.log(body)
  //       resolve(body)
  //     })
  //   })
  // } // mysqlRequest

}

module.exports = Mysql
