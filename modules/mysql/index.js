
"use strict"

const Extend  = require('../extend')
const request = require('request')

class Mysql extends Extend {

  constructor(options) { // http, db, collection
    super()
    this.lgmk = '≶ '
    this.name = this.constructor.name

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
    this.up     = [] //
    this.change = [] // change
    this.off    = [] // remove

    this.init()
  }

  init() {
    this.httpRequest.body.request = 'init'
    this.httpRequest.body.data = this.data
    request(this.httpRequest, (error, response, body) => {
      this.data = JSON.parse(body.data)
      console.log(this.lgmk + this.log_name(this.name, this.data.length))
      this.emit('init') // emit when done
    })
  } // init

  evaluate(data) { // add files to MongoDB
    console.log(data)
    console.log(this.lgmk + 'evaluate ' + this.name)

    // get data to delete ( this.off[] )
    if(this.data.length === 0) {
      console.log(this.lgmk + this.log_name(this.name, this.data.length) + ' to delete')
    } else {
      let d = 0
      this.data.forEach(function(mysql, index, array) {
        let test = false
        let c = 0
        data.forEach(function(file, i, a) {
          if(file.filename === mysql.filename) {
            test = true
          }

          c++
          if(c === a.length){
            if(!test){
              this.off.push(mysql)
              console.log(mysql.filename)
            }
            d++
          }

        }.bind(this))
        if(d === array.length){
          console.log(this.lgmk + this.log_name(this.name, this.off.length) + ' to delete')

          if(this.off.length > 0) {
            this.delete(this.off)
          }
        }

      }.bind(this)) // off END !!
    }

      // get up
      let f = 0
      data.forEach(function(file, index, array) {

        if(this.data.length === 0 || !Array.isArray(this.data)) {
          this.up.push(file)
          f++

        } else {

          let test = false
          let e = 0
          this.data.forEach(function(mysql, i, a) {

            if(file.filename === mysql.filename) {
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
          console.log(this.lgmk + this.log_name(this.name, this.up.length) + ' to insert')
          if(this.up.length > 0) {
            this.insert(this.up)
          }
        }
      }.bind(this)) // init END !!

      // get change
      if(this.data.length === 0) {
        console.log(this.lgmk + this.log_name(this.name, this.data.length) + ' to update')

      } else {
        let h = 0
        data.forEach(function(file, index, array) {

          let test = false
          let g = 0
          this.data.forEach(function(mysql, i, a) {
            mysql.modified = parseInt(mysql.modified, 10)
            if(mysql.filename === file.filename && mysql.modified === file.modified) {
              test = true
            }
            g++
            if(g === a.length){
              if(!test){
                this.change.push(file)
              }
              h++
            }
          }.bind(this))
          if(h === array.length){
            console.log(this.lgmk + this.log_name(this.name, this.change.length) + ' to update')
            if(this.change.length > 0) {
              this.update()
            }
          }
        }.bind(this))
      } // change END !!

  } // Mysql init END !!

  insert(select) {
    console.log('-- mysql insert')

    let data = {}
    select.forEach(function(file, index, array) {
      this.upData(file)
      const insert = this.makeInsert(file)
      data[index] = insert
    }.bind(this))
    const json = JSON.stringify(data)
    this.up = []

    this.httpRequest.body.request = 'insert'
    this.httpRequest.body.data    = json

    request(this.httpRequest,
      function (error, response, body){

      console.log(body)
    }.bind(this))

  } // to Mysql END !!

  update() {
    console.log('-- mysql update')

    let data = {} // create object with index
    this.change.forEach(function(file, index, array) {
      this.changeData(file)
      const insert = this.makeInsert(file)
      console.log(insert)
      data[index] = insert
    }.bind(this))
    const json = JSON.stringify(data)
    this.change = []

    this.httpRequest.body.request = 'update'
    this.httpRequest.body.data    = json

    request(this.httpRequest,
      function (error, response, body){

      console.log(body)
    }.bind(this))

  } // delete END !!

  makeInsert(file) {
    return {
      filename: file.filename,
      name: file.name,
      modified: file.modified,
      created: file.created,
      added: file.added,
      tags: JSON.stringify(file.tags),
      display: this.dsply + file.name + this.extension,
      thumbnail: this.thumb + file.name + this.extension,
      orientation: file.orientation
    }
  }

  delete(select) {
    console.log('- ' + this.name + ' delete')

    let data = {} // create object with index
    select.forEach(function(file, index, array) {
      this.offData(file)
      const insert = { filename: file.filename }
      data[index] = insert
    }.bind(this))
    const json = JSON.stringify(data)
    this.off = []

    this.httpRequest.body.request = 'delete'
    this.httpRequest.body.data    = json

    request(this.httpRequest, function (error, response, body){
      console.log(body)
    }.bind(this))

  } // delete END !!

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

  offData(file) {
    this.data.forEach(function(data, index) {
      if(data.filename === file.filename){
        this.data.splice(index, 1)
      }
    }.bind(this))
  } // offData END !!

  log_name(name, n) {
    return (n === 1 ? n + ' ' + name : n + ' ' + name + 's');
  }

}

module.exports = Mysql
