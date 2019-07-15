
"use strict"

class Comparison {

  constructor(options) {

  }

  // ----- comparison

  newFiles(data, input) {
    let select = []

    for(let i = 0; i < input.length; i++) {
      let test = true

      for(let j = 0; j < data.length; j++) {
        if(input[i].filename === data[j].filename) {
          test = false
        }
      }

      if(test) select.push(input[i])
    }

    return select
  } // newFiles

  oldFiles(data, input) {
    return this.newFiles(input, data)
  } // oldFiles

  modFiles(data, input) {
    let select = []

    for(let i = 0; i < input.length; i++) {
      let test = false

      for(let j = 0; j < data.length; j++) {
        if(data[j].filename === input[i].filename && data[j].modified !== input[i].modified) {
          test = true
        }
      }

      if(test) select.push(input[i])
    }

    return select
  } // modFiles

  modFlickr(data, input) {
    let select = []
    for (let i = 0; i < input.length; i++) {
      let test = false

      for (var j = 0; j < data.length; j++) {
        if(data[j].filename.split('.').slice(0, -1).join('.') === input[i].name) {

          input[i].filename = data[j].filename

          if(data[j].added !== input[i].added || data[j].views_flickr.length !== input[i].views) {

            if(data[j].added < input[i].added) {
              input[i].added = data[j].added
            }

            input[i].views_flickr = data[j].views_flickr
            if(data[j].views_flickr.length !== input[i].views) {

              const newViews = input[i].views - data[j].views_flickr.length
              const now = Math.floor(new Date().getTime()  / 1000)
              let latest = Math.max(...data[j].views_flickr.map(o => o.server))
              if(latest <= 0) {
                latest = input[i].added
              }
              const range = now - latest
              const steps = range / newViews
              for (let k = 0; k < newViews; k++) {
                input[i].views_flickr.push({ server: Math.round(latest + steps + (steps * k)) })
              }

            }
            test = true
          }
        }
      }

      if(test) select.push(input[i])
    }

    return select
  } // modFlickr

  modMysql(data, input) { // mongo mysql
    let select = []
    for (let i = 0; i < input.length; i++) {
      let test = false

      for (var j = 0; j < data.length; j++) {
        if(input[i].filename === data[j].filename) {

          if(input[i].views_mysql.length !==  data[j].views_mysql.length) {

            test = true
          }
        }
      }

      if(test) select.push(input[i])
    }

    return select
  } // modMysql

  modMongo(data, input) { // mysql mongo
    let select = []
    for (let i = 0; i < input.length; i++) {
      let test = false

      for (var j = 0; j < data.length; j++) {
        if(input[i].filename === data[j].filename) {

          // if(input[i].tags.length != data[j].tags.length) test = true
          if(input[i].orientation != data[j].orientation) test = true
          if(input[i].created != data[j].created) test = true
          if(input[i].views_flickr.length != data[j].views_flickr.length) test = true
          if(input[i].added != data[j].added) test = true
          if(input[i].modified != data[j].modified) test = true
        }
      }

      if(test) select.push(input[i])
    }

    return select
  } // modMysql

  // ----- console

  randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

}

module.exports = Comparison
