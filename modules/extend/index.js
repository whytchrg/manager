
"use strict"

const Events = require('events')

class Extend extends Events {

  constructor(options) {
    super()

  }

  newFiles(a, b) {
    let select = []

    for(let i = 0; i < a.length; i++) {
      let test = true

      for(let j = 0; j < b.length; j++) {
        if(a[i].filename === b[j].filename) test = false
      }

      if(test) select.push(a[i])
    }

    return select
  } // newFiles

  oldFiles(a, b) {
    return this.newFiles(b, a)
  } // oldFiles

  modFiles(a, b) {
    let select = []

    for(let i = 0; i < a.length; i++) {
      let test = false

      for(let j = 0; j < b.length; j++) {
        if(b[j].filename === a[i].filename && b[j].modified !== a[i].modified) {
          a[i].added = b[j].added
          test = true
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // modFiles

  modMysql(a, b) {
    let select = []

    for(let i = 0; i < a.length; i++) {
      let test = false

      for(let j = 0; j < b.length; j++) {
        if(b[j].filename === a[i].filename && a[i].mysql_up === true) {

          a[i].mysql_up = false
          test = true


        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // modFiles

  modMongo(a, b) {
    let select = []

    for(let i = 0; i < a.length; i++) {
      let test = false

      for(let j = 0; j < b.length; j++) {
        if(b[j].filename === a[i].filename && a[i].ftp_up === true) {
          a[i].ftp_up = false
          test = true
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // modFiles

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
        data[index].ftp_up = true
        callback()
      }
    })
  } // change callback

  fileChange(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {

        this.data[i].created = file.created
        this.data[i].time = file.time
        this.data[i].tags = file.tags
        this.data[i].modified = file.modified
        this.data[i].modified = file.modified
        this.data[i].added = file.added
        this.data[i].orientation = file.orientation
        this.data[i]._stats = file._stats
        this.data[i]._exif = file._exif
        this.data[i].ftp_up = true
        this.data[i].mysql_up = true

      }
    }

  } // change callback

  // flickrChange(data, file, callback) {
  //   data.forEach((element, index) => {
  //     if(element.name === file.title) {
  //       data[index].added = file.added
  //       data[index].views_flickr = file.views_flickr
  //       callback()
  //     }
  //   })
  // } // change callback

  flickrChange(file) {
    console.log(file)
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {
        this.data[i].added = file.added
        this.data[i].views_flickr = file.views_flickr
        this.data[i].mysql_up = true
      }
    }
  } // change callback

  mysqlChange(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {
        this.data[i].views_mysql = file.views
      }
    }
  } // change callback

  updateData(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {
        this.data[i] = file
        return true
      }
    }
  } // updateData

  unlinkData(file) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === file.filename) {
        this.data.splice(i, 1)
        return true
      }
    }
  } // unlinkData

  filename(path) {
    return path.match(/([^\/]*)\/*$/)[1]
  } // filename

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
