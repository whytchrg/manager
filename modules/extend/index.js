
"use strict"

const Events = require('events')

class Extend extends Events {

  constructor(options) {
    super()

  }

  getNew(a, b, callback) {
    let select = []
    let counter = 0
    if(a.length === 0) {
      callback(select)
    }
    a.forEach((element, index, array) => {
      let test = true
      let c = 0
      b.forEach((e, bindex, bArray) => {
        if(element.filename === e.filename) {
          test = false
        }
        c++
        if(c === bArray.length) {
          if(test) select.push(element)
          counter++
        }
      })
      if(counter === array.length || b.length === 0 && index === array.length-1) {
        if(b.length === 0) {
          select = a
        }
        callback(select)
      }
    })
  } // getNew

  getChanged(a, b, callback) {
    let select = []
    let counter = 0
    a.forEach((element, index, array) => {
      let test = false
      let c = 0
      b.forEach((e, bindex, bArray) => {
        if(e.filename === element.filename && e.modified !== element.modified) {
          element.added = e.added
          test = true
        }
        c++
        if(c === bArray.length) {
          if(test) select.push(element)
          counter++
        }
      })
      if(counter === array.length) {
        callback(select)
      }
    })
  } // getChanged

  getDeleted(a, b, callback) {
    this.getNew(b, a, (select) => {
      callback(select)
    })
  } // getDeleted

  change(data, file, callback) {
    data.forEach((element, index) => {
      if(element.filename === file.filename) {
        data[index] = file
        callback()
      }
    })
  } // change callback

  changeNEW(file) {
    this.data.forEach((element, index) => {
      if(element.filename === file.filename) {
        this.data[index] = file
        return true
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

  log(name, n) {
    return (n === 1 ? n + ' ' + name : n + ' ' + name + 's');
  }

}

module.exports = Extend
