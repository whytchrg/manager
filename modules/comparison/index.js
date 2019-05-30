
"use strict"

class Comparison {

  constructor(options) {

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

  getmysql(a, b) {
    let select = []
    for (let i = 0; i < a.length; i++) {
      let test = false

      for (var j = 0; j < b.length; j++) {
        if(a[i].filename === b[j].filename) {

          let views_mysql = []
          // console.log(b[j].views_mysql)
          if(b[j].views_mysql) {
            if(b[j].views_mysql[0].server) {
                views_mysql = b[j].views_mysql
            }
          }

          if(views_mysql.length != a[i].views.length) {

            test = true
          }
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // flickr

  getflickr(a, b) {
    let select = []
    for (let i = 0; i < a.length; i++) {
      let test = false

      for (var j = 0; j < b.length; j++) {
        if(a[i].title === b[j].name) {
          let added = b[j].added
          if(b[j].added > 1e11) {
            added = Math.floor(b[j].added / 1000)
          }
          const uploaded = parseInt(a[i].dateupload, 10)
          let views_flickr = []
          if(b[j].views_flickr) {
            views_flickr = b[j].views_flickr
          }

          if(added != uploaded || views_flickr.length != a[i].views) {
            a[i].added = added
            if(added > uploaded) {
              a[i].added =  uploaded
            }
            a[i].views_flickr = views_flickr
            if(views_flickr.length != a[i].views) {

              const newViews = a[i].views - views_flickr.length
              const now = Math.floor(new Date().getTime()  / 1000)
              let latest = Math.max(...views_flickr.map(o => o.server))
              if(latest <= 0) {
                latest = a[i].added
              }
              const range = now - latest
              const steps = range / newViews
              for (let k = 0; k < newViews; k++) {
                a[i].views_flickr.push({ server: Math.round(latest + steps + (steps * k)) })
              }

            }
            test = true
          }
        }
      }

      if(test) select.push(a[i])
    }

    return select
  } // getflickr

}

module.exports = Comparison
