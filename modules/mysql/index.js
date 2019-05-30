
"use strict"

const Extend  = require('../extend')
const request = require('request')

class Mysql extends Extend {

  constructor(options) { // http, db, collection
    super()
    this.icon = '≶ '
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
    this.httpRequest.body.request = 'init'
    this.httpRequest.body.data = []
    const a = await this.request(this.httpRequest)
    const b = await this.process(a)

    this.data = b
    console.log(this.icon + this.log(this.module, this.data.length))
    console.log(this.data)
    this.emit('init') // emit when done


    // this.httpRequest.body.request = 'init'
    // this.httpRequest.body.data = this.data
    // request(this.httpRequest, (error, response, body) => {
    //   this.data = this.process(JSON.parse(body.data, true))
    //   console.log(this.icon + this.log(this.module, this.data.length))
    //   console.log(this.data)
    //   this.emit('init') // emit when done
    // })
  } // init

  request(r) {
    return new Promise((resolve, reject) => {

      request(r, (error, response, body) => {
        resolve(JSON.parse(body.data))
      })

    })
  } // request

  process(data) {

    for(let i = 0; i < data.length; i++) {
      let views = []

      if(typeof data[i].views === 'string') {
        const rawView = data[i].views.split(';')

        for(let j = 0; j < rawView.length; j++) {
          if(rawView[j].includes('server')){
            let view = JSON.parse(rawView[j])
            view.client = Math.floor(view.client / 1000)
            view.server = parseInt(view.server, 10)
            views.push(view)
          }
        }
      }
      data[i].views = views

      let views_flickr = []

      if(typeof data[i].views_flickr === 'string') {

        if(data[i].views_flickr.includes('server')){
          const rawFlickr = JSON.parse(data[i].views_flickr)
          for(let j = 0; j < rawFlickr.length; j++) {

            // console.log(rawFlickr[j])
            let flickr = rawFlickr[j]
            flickr.server = parseInt(flickr.server, 10)
            views_flickr.push(flickr)
          }
        }
      }
      data[i].views_flickr = views_flickr

    }

    return data
  } // process

  async evaluate(mongos) {
    let p = false

    const a = this.newFiles(mongos, this.data)
    const b = this.modMysql(mongos, this.data)
    const c = this.oldFiles(mongos, this.data)

    if(await a && await b && await c){

      if(a.length + b.length + c.length > 0){
        p = true
        this.emit('progress')
      }

      console.log(this.icon + this.log(this.module, a.length) + ' to insert from Files')
      const i = this.insert(a)

      console.log(this.icon + this.log(this.module, b.length) + ' to update from Files')
      const u = this.update(b)

      console.log(this.icon + this.log(this.module, c.length) + ' to delete from Files')
      const d = this.delete(c)

      if(await i && await u && await d){
        if(p) this.emit('done')
        return true
      }
    }

  } // evaluate

  // evaluate(data) { // add files to MongoDB
  //   console.log(data)
  //   console.log(this.icon + 'evaluate ' + this.module)
  //
  //   // get data to delete ( this.off[] )
  //   if(this.data.length === 0) {
  //     console.log(this.icon + this.log_name(this.module, this.data.length) + ' to delete')
  //   } else {
  //     let d = 0
  //     this.data.forEach(function(mysql, index, array) {
  //       let test = false
  //       let c = 0
  //       data.forEach(function(file, i, a) {
  //         if(file.filename === mysql.filename) {
  //           test = true
  //         }
  //
  //         c++
  //         if(c === a.length){
  //           if(!test){
  //             this.off.push(mysql)
  //             console.log(mysql.filename)
  //           }
  //           d++
  //         }
  //
  //       }.bind(this))
  //       if(d === array.length){
  //         console.log(this.icon + this.log_name(this.module, this.off.length) + ' to delete')
  //
  //         if(this.off.length > 0) {
  //           this.delete(this.off)
  //         }
  //       }
  //
  //     }.bind(this)) // off END !!
  //   }
  //
  //     // get up
  //     let f = 0
  //     data.forEach(function(file, index, array) {
  //
  //       if(this.data.length === 0 || !Array.isArray(this.data)) {
  //         this.up.push(file)
  //         f++
  //
  //       } else {
  //
  //         let test = false
  //         let e = 0
  //         this.data.forEach(function(mysql, i, a) {
  //
  //           if(file.filename === mysql.filename) {
  //             test = true
  //           }
  //
  //           e++
  //           if(e === a.length){
  //             if(!test){
  //               this.up.push(file)
  //             }
  //             f++
  //           }
  //
  //         }.bind(this))
  //
  //       }
  //
  //       if(f === array.length){
  //         console.log(this.icon + this.log_name(this.module, this.up.length) + ' to insert')
  //         if(this.up.length > 0) {
  //           this.insert(this.up)
  //         }
  //       }
  //     }.bind(this)) // init END !!
  //
  //     // get change
  //     if(this.data.length === 0) {
  //       console.log(this.icon + this.log_name(this.module, this.data.length) + ' to update')
  //
  //     } else {
  //       let h = 0
  //       data.forEach(function(file, index, array) {
  //
  //         let test = false
  //         let g = 0
  //         this.data.forEach(function(mysql, i, a) {
  //           mysql.modified = parseInt(mysql.modified, 10)
  //           if(mysql.filename === file.filename && mysql.modified === file.modified) {
  //             test = true
  //           }
  //           g++
  //           if(g === a.length){
  //             if(!test){
  //               this.change.push(file)
  //             }
  //             h++
  //           }
  //         }.bind(this))
  //         if(h === array.length){
  //           console.log(this.icon + this.log_name(this.module, this.change.length) + ' to update')
  //           if(this.change.length > 0) {
  //             this.update()
  //           }
  //         }
  //       }.bind(this))
  //     } // change END !!
  //
  // } // Mysql init END !!

  insert(select) {
    return new Promise((resolve, reject) => {

      if(select.length === 0) {
        resolve(true)
      }
      let data = {}
      select.forEach((file, index, array) => {
        if(index === 0) {
          console.log(this.icon + this.module + ' insert')
        }
        this.upData(file)
        const insert = this.makeInsert(file)
        data[index] = insert
      })
      const json = JSON.stringify(data)

      this.httpRequest.body.request = 'insert'
      this.httpRequest.body.data    = json

      request(this.httpRequest, (error, response, body) =>{
        if(select.length !== 0) {
          console.log(this.icon + this.module + ' inserted')
          resolve(true)
        }
      })
    })
  } // insert

  update(select) {
    return new Promise((resolve, reject) => {
      if(select.length === 0) {
        resolve(true)
      }
      let data = {} // create object with index
      for (let i = 0; i < select.length; i++) {
        if(i === 0) {
          console.log(this.icon + this.module + ' update')
        }
        this.changeData(select[i])
        const insert = this.makeInsert(select[i])
        // console.log(insert)
        data[i] = insert
      }
      // select.forEach((file, i, array) => {
      //   if(index === 0) {
      //     console.log(this.icon + this.module + ' update')
      //   }
      //   this.changeData(file)
      //   const insert = this.makeInsert(file)
      //   // console.log(insert)
      //   data[i] = insert
      // })
      const json = JSON.stringify(data)

      this.httpRequest.body.request = 'update'
      this.httpRequest.body.data    = json

      request(this.httpRequest, (error, response, body) => {
        if(select.length !== 0) {
          console.log(this.icon + this.module + ' updated')
          resolve(true)
        }
      })
    })
  } // delete END !!

  makeInsert(file) {
    return {
      filename: file.filename,
      name: file.name,
      modified: file.modified,
      created: file.created,
      added: file.added,
      views_flickr: JSON.stringify(file.views_flickr),
      tags: JSON.stringify(file.tags),
      display: this.dsply + file.name + this.extension,
      thumbnail: this.thumb + file.name + this.extension,
      orientation: file.orientation
    }
  }

  delete(select) {
    return new Promise((resolve, reject) => {
      if(select.length === 0) {
        resolve(true)
      }

      let data = {} // create object with index
      select.forEach(function(file, index, array) {
        if(index === 0) {
          console.log(this.icon + this.module + ' delete')
        }
        this.offData(file)
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
