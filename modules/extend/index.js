
"use strict"

const Events = require('events')

class Extend extends Events {

  constructor(options) {
    super()

  }

  notB(a, b, callback) { // compare by filename a != b = select
    let select = []
    let aCount = 0
    a.forEach(function(aObject, aIndex, aArray) {
      let test = false
      let bCount = 0
      b.forEach(function(bObject, bindex, bArray) {
        if(aObject.filename === bObject.filename) {
          test = true
        }
        bCount++
        if(bCount === bArray.length) {
          if(!test) select.push(aObject)
          aCount++
        }
      }.bind(this))
      if(aCount === aArray.length) {
        callback(select)
      }
    })
  } // not B

  oldB(a, b, callback) { // compare by filename && modified

    let select = []
    let aCount = 0

    a.forEach(function(aObject, aIndex, aArray) {

      let test = false
      let bCount = 0
      b.forEach(function(bObject, bindex, bArray) {

        if(bObject.filename === aObject.filename && bObject.modified === aObject.modified) { // modified <== modified  eval if true not !true
          test = true
        }

        bCount++
        if(bCount === bArray.length){
          if(!test) select.push(aObject)
          aCount++
        }

      }.bind(this))
      if(aCount === aArray.length){
        callback(select)
      }
    })

  } // not B

  notA(a, b, callback) {
    this.notB(b, a, function(select) {
      callback(select)
    })
  } // not A

  change(data, file, callback) {
    data.forEach(function(element, index) {
      if(element.filename === file.filename){
        data[index] = file
        callback()
      }
    })
  } // change callback

  unlink(data, file, callback) {
    data.forEach(function(element, index) {
      if(element.filename === file.filename) {
        data.splice(index, 1)
        callback()
      }
    })
  } // unlink callback

}

module.exports = Extend
